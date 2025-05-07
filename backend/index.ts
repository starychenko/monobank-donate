import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import type { Request, Response, RequestHandler, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import helmet from 'helmet';
import { xss } from 'express-xss-sanitizer';
import https from 'https';
import http from 'http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DEFAULT_JAR_URL = process.env.DEFAULT_JAR_URL || '';
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Налаштування обмежень для rate limit
const RATE_LIMIT_GLOBAL_MAX = Number(process.env.RATE_LIMIT_GLOBAL_MAX) || (IS_PRODUCTION ? 300 : 1000);
const RATE_LIMIT_PARSE_MAX = Number(process.env.RATE_LIMIT_PARSE_MAX) || (IS_PRODUCTION ? 30 : 100);
const RATE_LIMIT_BRUTEFORCE_MAX = Number(process.env.RATE_LIMIT_BRUTEFORCE_MAX) || (IS_PRODUCTION ? 20 : 50);
const REQUEST_SIZE_LIMIT = process.env.REQUEST_SIZE_LIMIT || '10kb';

// Налаштування для puppeteer
const PUPPETEER_NAVIGATION_TIMEOUT = Number(process.env.PUPPETEER_NAVIGATION_TIMEOUT) || 30000;
const PUPPETEER_WAIT_TIMEOUT = Number(process.env.PUPPETEER_WAIT_TIMEOUT) || 15000;
const PUPPETEER_STATS_TIMEOUT = Number(process.env.PUPPETEER_STATS_TIMEOUT) || 10000;

// Налаштування для механізму повторних спроб
const MAX_RETRIES = Number(process.env.MAX_RETRIES) || 3;
const RETRY_INITIAL_DELAY = Number(process.env.RETRY_INITIAL_DELAY) || 1000;

// Налаштування для скріншотів
const SCREENSHOTS_ENABLED = process.env.SCREENSHOTS_ENABLED === 'true' || NODE_ENV === 'development';
const SCREENSHOTS_PATH = process.env.SCREENSHOTS_PATH || 'monobank-error.png';

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
app.use(express.json({ limit: REQUEST_SIZE_LIMIT }));

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
  max: RATE_LIMIT_GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: createLimitMessage('API', 15, RATE_LIMIT_GLOBAL_MAX),
  skip: (req, res) => !IS_PRODUCTION && req.ip === '127.0.0.1', // В розробці пропускаємо локальні запити
  keyGenerator: (req) => {
    // Використовуємо або X-Forwarded-For, або IP
    return (req.headers['x-forwarded-for'] as string || req.ip || 'unknown-ip');
  }
});

// 2. Суворіший лімітер для конкретного ендпоінту з парсингом
const parseMonobankLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 хвилин
  max: RATE_LIMIT_PARSE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: createLimitMessage('parse-monobank', 5, RATE_LIMIT_PARSE_MAX),
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
  max: RATE_LIMIT_BRUTEFORCE_MAX,
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
    // Перевіряємо доступність URL перед запуском Puppeteer
    const isUrlAccessible = await checkUrlAvailability(jarUrl);
    if (!isUrlAccessible) {
      throw new Error(`Monobank URL is not accessible: ${jarUrl}`);
    }
    
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
    await page.setDefaultNavigationTimeout(PUPPETEER_NAVIGATION_TIMEOUT);
    
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
    
    // Функція для повторних спроб з експоненційним очікуванням
    const retry = async <T>(
      fn: () => Promise<T>, 
      maxRetries: number = MAX_RETRIES, 
      retryDelay: number = RETRY_INITIAL_DELAY
    ): Promise<T> => {
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Перевіряємо, чи є це мережевою помилкою, яку варто повторити
          const errorMessage = lastError.message.toLowerCase();
          const isNetworkError = 
            errorMessage.includes('net::err_socket') || 
            errorMessage.includes('net::err_connection') ||
            errorMessage.includes('net::err_timed_out') ||
            errorMessage.includes('navigation timeout');
          
          // Якщо це не мережева помилка або остання спроба, припиняємо спроби
          if (!isNetworkError || attempt === maxRetries) {
            throw lastError;
          }
          
          // Експоненційне очікування між спробами (1с, 2с, 4с...)
          const delay = retryDelay * Math.pow(2, attempt - 1);
          console.warn(`Network error encountered, retrying (${attempt}/${maxRetries}) after ${delay}ms: ${lastError.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Цей код не повинен виконатись, але TypeScript вимагає повернення
      throw lastError;
    };
    
    try {
      // Використовуємо функцію повторних спроб при переході на сторінку
      await retry(() => page.goto(jarUrl, { 
        waitUntil: 'networkidle2',
        timeout: PUPPETEER_WAIT_TIMEOUT // Збільшуємо таймаут до 45 секунд
      }));
      
      // Перевіряємо, чи є перенаправлення на іншу сторінку
      const currentUrl = page.url();
      if (currentUrl !== jarUrl && !currentUrl.includes('send.monobank.ua/jar/')) {
        throw new Error(`Redirected to unexpected URL: ${currentUrl}`);
      }
      
      // Більш надійне очікування завантаження структури сторінки
      try {
        // Спочатку чекаємо заголовок (h1) - це основна ознака, що сторінка завантажилась
        await retry(() => page.waitForSelector('header .field.name h1', { 
          timeout: PUPPETEER_WAIT_TIMEOUT
        }));
        
        // Додатково чекаємо, щоб завантажились дані статистики
        await retry(() => page.waitForSelector('.jar-stats .stats-data-value', { 
          timeout: PUPPETEER_STATS_TIMEOUT
        }));
      } catch (waitError) {
        // Виконуємо скріншот для діагностики при проблемах
        if (SCREENSHOTS_ENABLED) {
          await page.screenshot({ path: SCREENSHOTS_PATH });
          console.error(`Screenshot saved to ${SCREENSHOTS_PATH}`);
        }
        
        // Перевіряємо вміст сторінки для кращої діагностики
        const pageContent = await page.content();
        const bodyTextContent = await page.$eval('body', el => el.textContent || '');
        
        if (!bodyTextContent.trim()) {
          throw new Error('Monobank returned empty page');
        }
        
        if (bodyTextContent.includes('не знайдено') || bodyTextContent.includes('not found')) {
          throw new Error('Monobank jar not found or has been removed');
        }
        
        // Якщо причина не визначена, передаємо оригінальну помилку
        throw waitError;
      }
      
      const data = await page.evaluate(() => {
        const getText = (selector: string) => {
          const el = document.querySelector(selector);
          return el ? el.textContent?.trim() : null;
        };
        
        // Більш надійний спосіб отримати елементи: знаходимо по іконках або унікальних класах
        const findValueByIcon = (iconSrc: string): string | null => {
          // Знаходимо всі img елементи
          const icons = Array.from(document.querySelectorAll('.jar-stats img.icon'));
          // Знаходимо той, який містить вказаний src
          const targetIcon = icons.find(icon => (icon as HTMLImageElement).src.includes(iconSrc));
          
          if (!targetIcon) return null;
          
          // Знаходимо батьківський .stats-data
          const statsData = targetIcon.closest('.stats-data');
          if (!statsData) return null;
          
          // Отримуємо .stats-data-value з цього контейнера
          const valueElement = statsData.querySelector('.stats-data-value');
          return valueElement ? valueElement.textContent?.trim() || null : null;
        };
        
        // Основний заголовок збору
        const title = getText('header .field.name h1');
        
        // Знаходимо значення за їх іконками
        const collected = findValueByIcon('collected.svg');
        const target = findValueByIcon('target.svg');
        
        // Запасний варіант, якщо пошук за іконками не спрацював
        const collectedBackup = getText('header .jar-stats > div:nth-child(1) .stats-data-value');
        const targetBackup = getText('header .jar-stats > div:nth-child(2) .stats-data-value');
        
        // Отримання тексту власника збору
        const ownerInfo = getText('.field.jarOwnerInfo span');
        
        return {
          title,
          collected: collected || collectedBackup,
          target: target || targetBackup,
          _debug: {
            ownerInfo, // тільки для діагностики, не повертаємо клієнту
            collectedFound: !!collected,
            targetFound: !!target,
            usedBackup: !collected || !target
          }
        };
      });
      
      // Типізація для результату парсингу
      interface ParsedData {
        title: string | null;
        collected: string | null;
        target: string | null;
        _debug?: {
          ownerInfo: string | null;
          collectedFound: boolean;
          targetFound: boolean;
          usedBackup: boolean;
        };
      }
      
      // Приведення типу
      const parsedData = data as ParsedData;
      
      // Закриваємо браузер перед будь-якими іншими операціями
      await browser.close();
      
      // Валідуємо отримані дані
      if (!parsedData.title || !parsedData.collected || !parsedData.target) {
        console.warn(`Incomplete parse results for ${jarUrl}. Got: title=${parsedData.title}, collected=${parsedData.collected}, target=${parsedData.target}`);
        if (parsedData._debug) {
          console.debug('Debug info:', parsedData._debug);
        }
      } else {
        console.info(`Successfully parsed jar data: "${parsedData.title}" - ${parsedData.collected} of ${parsedData.target}`);
      }
      
      // Видаляємо діагностичні дані перед відправкою клієнту
      if (parsedData._debug) {
        delete parsedData._debug;
      }
      
      // Кешування результатів можна додати тут в майбутньому
      
      res.json(parsedData);
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

// Функція для перевірки доступності URL
function checkUrlAvailability(url: string, timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'HEAD',
      timeout: timeout,
    };

    const req = https.request(options, (res) => {
      // Перевіряємо HTTP статус
      const statusCode = res.statusCode || 0;
      const statusOk = statusCode >= 200 && statusCode < 400;
      resolve(statusOk);
    });

    req.on('error', () => {
      // У випадку помилки вважаємо URL недоступним
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
} 