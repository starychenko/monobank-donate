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

// Налаштування рейт-лімітингу
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 100, // Максимальна кількість запитів з однієї IP адреси
  standardHeaders: true, // Повертає інформацію про ліміт в заголовках `RateLimit-*`
  legacyHeaders: false, // Відключає заголовки `X-RateLimit-*`
  message: 'Забагато запитів з цієї IP адреси, спробуйте пізніше',
});

// Застосовуємо рейт-лімітинг до всіх запитів API
app.use('/api/', apiLimiter);

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
  console.log(`Server started on port ${PORT}`);
}); 