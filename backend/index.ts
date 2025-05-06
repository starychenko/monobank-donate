import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import type { Request, Response, RequestHandler, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import helmet from 'helmet';
import { xss } from 'express-xss-sanitizer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DEFAULT_JAR_URL = process.env.DEFAULT_JAR_URL || '';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Безпека: Встановлюємо заголовки безпеки за допомогою Helmet
app.use(helmet());

// Налаштування CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));

// Безпека: обмеження розміру даних
app.use(express.json({ limit: '10kb' }));

// Безпека: чистка даних від XSS
app.use(xss());

// Функція для створення власного повідомлення про перевищення ліміту
const createLimitMessage = (endpoint: string, windowMin: number, maxRequests: number): string => {
  return `Забагато запитів до ${endpoint}. Максимум ${maxRequests} запитів за ${windowMin} хвилин. Спробуйте пізніше.`;
};

// Функція для журналювання спроб перевищення ліміту
const logRateLimitExceeded = (req: Request, res: Response, next: NextFunction): void => {
  if (res.statusCode === 429) {
    console.warn(`Rate limit exceeded: ${req.method} ${req.originalUrl} from IP ${req.ip}`);
  }
  next();
};

// НАЛАШТУВАННЯ RATE LIMITING

// 1. Базовий лімітер для всіх API запитів
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: IS_PRODUCTION ? 300 : 1000, // Більш жорсткий в production
  standardHeaders: true,
  legacyHeaders: false,
  message: createLimitMessage('API', 15, IS_PRODUCTION ? 300 : 1000),
  skip: (req, res) => !IS_PRODUCTION && req.ip === '127.0.0.1', // В розробці пропускаємо локальні запити
  keyGenerator: (req) => {
    // Використовуємо або X-Forwarded-For, або IP
    return (req.headers['x-forwarded-for'] as string || req.ip || 'unknown-ip');
  }
});

// 2. Суворіший лімітер для конкретного ендпоінту з парсингом
const parseMonobankLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 хвилин
  max: IS_PRODUCTION ? 30 : 100, // Максимум 30 запитів за 5 хвилин в production
  standardHeaders: true,
  legacyHeaders: false,
  message: createLimitMessage('parse-monobank', 5, IS_PRODUCTION ? 30 : 100),
  skipSuccessfulRequests: false, // Лічимо всі запити, не лише успішні
  skipFailedRequests: false, // Лічимо навіть невдалі запити  
  // Зберігаємо IP в нормалізованому вигляді для запобігання обходу
  keyGenerator: (req) => {
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip;
    return `${ip}:parse-monobank`;
  },
  handler: (req, res, next, options) => {
    // Записуємо інформацію про спроби перевищення ліміту
    console.warn(`Rate limit exceeded for parse-monobank: IP ${req.ip}, UA: ${req.headers['user-agent']}`);
    res.status(429).json({
      error: 'Too many requests',
      message: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000 / 60) // В хвилинах
    });
  }
});

// 3. Екстремальний лімітер для захисту від потенційних атак
const bruteForceProtectionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 хвилина
  max: IS_PRODUCTION ? 20 : 50, // Максимум 20 запитів за 1 хвилину в production
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Підозріла активність. Ваш доступ тимчасово обмежено.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  // Використання функції для блокування IP при перевищенні
  handler: (req, res, next, options) => {
    // Можна додати логіку блокування в базі даних або кеші
    console.error(`Potential attack detected: IP ${req.ip}, UA: ${req.headers['user-agent']}`);
    res.status(429).json({
      error: 'Access temporarily denied',
      message: options.message
    });
  }
});

// Застосовуємо ієрархію лімітерів
app.use('/api/', globalLimiter, logRateLimitExceeded);
app.use('/api/parse-monobank', parseMonobankLimiter, bruteForceProtectionLimiter);

// Встановлюємо проміжне ПЗ для логування запитів (спрощений аналог morgan)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    console[logLevel](
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms IP:${req.ip}`
    );
  });
  next();
});

// Валідація вхідних даних
const validateMonobankUrl = [
  body('url')
    .optional()
    .isString()
    .withMessage('URL повинен бути рядком')
    .trim()
    .notEmpty()
    .withMessage('URL не може бути порожнім')
    .isURL()
    .withMessage('URL повинен бути дійсним посиланням')
    .matches(/^https:\/\/send\.monobank\.ua\/jar\/[a-zA-Z0-9]+$/)
    .withMessage('URL повинен бути дійсним посиланням на jar Monobank')
];

const parseMonobankHandler: RequestHandler = async (req, res) => {
  // Перевірка результатів валідації
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { url } = req.body;
  const jarUrl = url || DEFAULT_JAR_URL;
  
  try {
    // Додаємо додаткові параметри безпеки для Puppeteer
    const browser = await puppeteer.launch({ 
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      headless: true // Використовуємо headless режим
    });
    
    const page = await browser.newPage();
    
    // Встановлюємо таймаут для запиту
    await page.setDefaultNavigationTimeout(30000);
    
    // Блокуємо зайві ресурси для пришвидшення
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    try {
      await page.goto(jarUrl, { waitUntil: 'networkidle2' });
      await page.waitForSelector('header .field.name h1', { timeout: 10000 });
      
      const data = await page.evaluate(() => {
        const getText = (selector: string) => {
          const el = document.querySelector(selector);
          return el ? el.textContent?.trim() : null;
        };
        return {
          title: getText('header .field.name h1'),
          collected: getText('header .jar-stats > div:nth-child(1) .stats-data-value'),
          target: getText('header .jar-stats > div:nth-child(2) .stats-data-value'),
        };
      });
      
      await browser.close();
      
      // Кешування результатів можна додати тут в майбутньому
      
      res.json(data);
    } catch (innerError) {
      await browser.close();
      throw innerError;
    }
  } catch (error) {
    console.error('Error parsing Monobank page:', error);
    res.status(500).json({ 
      error: 'Failed to parse page', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

app.post('/api/parse-monobank', validateMonobankUrl, parseMonobankHandler);

// Middleware для обробки невідомих маршрутів
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Middleware для обробки помилок
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    // При розробці можна повертати деталі помилки, в продакшені - ні
    ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} in ${NODE_ENV} mode`);
}); 