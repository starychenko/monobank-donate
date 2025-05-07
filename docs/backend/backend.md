# Документація бекенд-частини Monobank Donate

## Загальний огляд

Бекенд-частина проекту Monobank Donate відповідає за отримання актуальних даних про стан благодійних зборів з платформи Monobank та надання їх фронтенду через API. Основна технічна задача полягає у парсингу веб-сторінки збору коштів Monobank та забезпеченні надійного і безпечного API.

## Технологічний стек

- **Мова програмування**: TypeScript
- **Середовище виконання**: Node.js
- **Веб-фреймворк**: Express 5.1.0
- **Інструмент парсингу**: Puppeteer 24.8.0
- **Бібліотеки безпеки**:
  - express-rate-limit 7.5.0 (захист від DoS)
  - express-validator 7.2.1 (валідація вхідних даних)
  - express-xss-sanitizer 2.0.0 (захист від XSS)
  - helmet 8.1.0 (захист через HTTP-заголовки)
  - cors 2.8.5 (керування CORS)

## Структура проекту

```
backend/
├── index.ts                   # Основний файл додатку
├── package.json               # Налаштування залежностей
├── tsconfig.json              # Конфігурація TypeScript
└── types/
    └── express-xss-sanitizer.d.ts  # Типи для модуля express-xss-sanitizer
```

## Діаграма потоків даних

Нижче представлена діаграма основного потоку даних у бекенді:

```
┌───────────┐         ┌─────────────┐        ┌────────────┐         ┌──────────┐
│           │ HTTP    │             │ HTTPS  │            │ Parse   │          │
│ Клієнт    │────────►│ API сервер  │───────►│ Monobank   │────────►│ Обробка  │
│ (React)   │◄────────│ (Express)   │◄───────│ Jar сторінка│◄────────│ даних    │
│           │ JSON    │             │ HTML   │            │ Raw Data│          │
└───────────┘         └─────────────┘        └────────────┘         └──────────┘
                             │
                             │ Логування
                             ▼
                      ┌─────────────┐
                      │ Консоль     │
                      │ (майбутня БД)│
                      └─────────────┘

Компоненти безпеки (застосовуються до кожного запиту):
- Валідація вхідних даних (express-validator)
- Rate limiting (express-rate-limit)
- XSS захист (express-xss-sanitizer)
- HTTP заголовки безпеки (helmet)
- CORS (cors)
```

## Налаштування середовища

### Змінні оточення (.env)

Проект використовує наступні змінні оточення:

```
# URL банки за замовчуванням
DEFAULT_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Кешування
CACHE_TTL=15

# Безпека
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# Режим розробки
NODE_ENV=development
```

> **Примітка:** Порт API сервера (3001) жорстко закодований у коді і не налаштовується через змінні оточення.

### Встановлення та запуск

```bash
# Встановлення залежностей
npm install

# Запуск в режимі розробки
npm run dev

# Збірка для production
npm run build

# Запуск в production
npm start
```

## API Документація

### Отримання даних про збір

**Ендпоінт:** `/api/parse-monobank`

**Метод:** `POST`

**Вхідні дані:**
```json
{
  "url": "https://send.monobank.ua/jar/YOUR_JAR_ID"
}
```
Параметр `url` є опціональним. Якщо не вказаний, використовується значення `DEFAULT_JAR_URL` з налаштувань.

**Відповідь (успішна):**
```json
{
  "title": "Назва збору",
  "collected": "48 710 ₴",
  "target": "150 000 ₴"
}
```

**Відповідь (помилка):**
```json
{
  "error": "Failed to parse page",
  "message": "Текст помилки"
}
```

**Коди відповідей:**
- `200 OK` - Успішно отримано дані
- `400 Bad Request` - Невірні вхідні дані
- `429 Too Many Requests` - Перевищено ліміт запитів
- `500 Internal Server Error` - Помилка сервера

### Приклади використання API

#### Використання через cURL

```bash
# Базовий запит з використанням URL за замовчуванням
curl -X POST http://localhost:3001/api/parse-monobank \
  -H "Content-Type: application/json"

# Запит із власним URL
curl -X POST http://localhost:3001/api/parse-monobank \
  -H "Content-Type: application/json" \
  -d '{"url": "https://send.monobank.ua/jar/ABC123XYZ"}'
```

#### Використання через JavaScript (fetch)

```javascript
// Приклад запиту з використанням fetch
const fetchData = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/parse-monobank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://send.monobank.ua/jar/ABC123XYZ'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Помилка запиту');
    }
    
    const data = await response.json();
    console.log('Дані про збір:', data);
    return data;
  } catch (error) {
    console.error('Помилка при отриманні даних:', error);
    throw error;
  }
};
```

#### Використання через Postman

1. Створіть новий запит в Postman
2. Встановіть метод `POST`
3. Введіть URL `http://localhost:3001/api/parse-monobank`
4. Перейдіть на вкладку `Body`
5. Виберіть `raw` і встановіть формат `JSON`
6. Введіть тіло запиту:
   ```json
   {
     "url": "https://send.monobank.ua/jar/YOUR_JAR_ID"
   }
   ```
7. Натисніть `Send`

## Архітектура та реалізація

### Обмеження запитів (Rate Limiting)

Бекенд має багаторівневу систему обмеження запитів:

1. **Глобальний ліміт**:
   - 300 запитів за 15 хвилин у production
   - 1000 запитів за 15 хвилин у development

2. **Ліміт для ендпоінту /api/parse-monobank**:
   - 30 запитів за 5 хвилин у production
   - 100 запитів за 5 хвилин у development

3. **Захист від брутфорсу**:
   - 20 запитів за 1 хвилину у production
   - 50 запитів за 1 хвилину у development

### Парсинг даних Monobank

Процес отримання даних складається з наступних етапів:

1. **Перевірка доступності URL** перед запуском Puppeteer
2. **Ініціалізація Puppeteer** з оптимізованими параметрами безпеки
3. **Блокування зайвих ресурсів** (зображення, шрифти, медіа) для пришвидшення
4. **Перехід на сторінку** з системою повторних спроб при помилках
5. **Очікування завантаження ключових елементів** сторінки
6. **Парсинг даних** через селектори та пошук за іконками
7. **Валідація отриманих даних** та формування відповіді

#### Детальний опис взаємодії з Puppeteer

Puppeteer використовується для отримання даних зі сторінки збору Monobank. Процес взаємодії включає:

1. **Налаштування браузера**:
   ```typescript
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
     headless: true
   });
   ```

2. **Стратегія вибору селекторів**:
   
   Веб-сторінка Monobank має наступну структуру ключових елементів:
   
   - Заголовок збору: `header .field.name h1`
   - Контейнер статистики: `.jar-stats`
   - Зібрана сума (перший спосіб): іконка з `collected.svg` → батьківський `.stats-data` → `.stats-data-value`
   - Цільова сума (перший спосіб): іконка з `target.svg` → батьківський `.stats-data` → `.stats-data-value`
   - Зібрана сума (резервний спосіб): `header .jar-stats > div:nth-child(1) .stats-data-value`
   - Цільова сума (резервний спосіб): `header .jar-stats > div:nth-child(2) .stats-data-value`

3. **Вибір стабільних селекторів**:
   
   Оскільки сторінка Monobank може змінюватись, використовується два альтернативні методи для отримання даних:
   
   - Пошук за іконками (більш стабільний метод)
   - Пошук за структурою DOM (резервний метод)

4. **Оптимізація продуктивності**:
   
   Для прискорення роботи Puppeteer блокуються зайві ресурси:
   
   ```typescript
   await page.setRequestInterception(true);
   page.on('request', (req) => {
     const resourceType = req.resourceType();
     if (resourceType === 'image' || resourceType === 'font' || resourceType === 'media') {
       req.abort();
     } else {
       req.continue();
     }
   });
   ```

5. **Алгоритми парсингу**:

   Основний алгоритм для пошуку за іконками:
   
   ```typescript
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
   ```

### Оптимізація та стабільність

#### Повна реалізація функції повторних спроб

```typescript
const retry = async <T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  retryDelay: number = 1000
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
```

Ця функція забезпечує стабільність під час мережевих проблем шляхом:
1. Реалізації експоненційного очікування між спробами
2. Розпізнавання мережевих помилок, які можна повторити
3. Логування кожної спроби для діагностики
4. Обмеження максимальної кількості спроб

#### Функція перевірки доступності URL

```typescript
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
```

Ця функція забезпечує швидку перевірку доступності URL перед запуском ресурсномісткого Puppeteer.

### Безпека

1. **Валідація вхідних даних**:
   ```typescript
   const validateMonobankUrl = [
     body('url')
       .optional()
       .isString()
       .trim()
       .notEmpty()
       .isURL()
       .matches(/^https:\/\/send\.monobank\.ua\/jar\/[a-zA-Z0-9]+$/)
   ];
   ```

2. **XSS-захист**:
   ```typescript
   app.use(xss({ sanitizeRecursively: true }));
   ```

3. **Безпечні HTTP-заголовки**:
   ```typescript
   app.use(helmet());
   ```

4. **CORS-налаштування**:
   ```typescript
   const corsOptions = {
     origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
     methods: ['POST', 'OPTIONS'],
     allowedHeaders: ['Content-Type'],
   };
   app.use(cors(corsOptions));
   ```

5. **Обмеження розміру даних**:
   ```typescript
   app.use(express.json({ limit: '10kb' }));
   ```

## Обробка помилок та логування

1. **Логування запитів**:
   ```typescript
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
   ```

2. **Обробка невідомих маршрутів**:
   ```typescript
   app.use((req, res) => {
     res.status(404).json({ error: 'Not found' });
   });
   ```

3. **Обробка неочікуваних помилок**:
   ```typescript
   app.use((err, req, res, _next) => {
     console.error(err.stack);
     res.status(500).json({ 
       error: 'Internal server error',
       ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
     });
   });
   ```

## Налагодження та діагностика

### Типові проблеми та їх рішення

#### 1. Проблеми з Puppeteer

| Проблема | Можлива причина | Рішення |
|---------|-----------------|---------|
| Помилка `Error: net::ERR_CONNECTION_REFUSED` | Проблеми з мережею або недоступність Monobank | Перевірте підключення до інтернету. Впевніться, що сервіс Monobank працює. |
| Помилка `Protocol error: Connection closed` | Puppeteer завершив роботу до завершення операції | Збільшіть значення `timeout` для операцій. Перевірте доступні ресурси серверу. |
| `TimeoutError: Navigation timeout` | Сторінка повільно завантажується | Збільшіть значення `timeout` у `page.goto()`. Перевірте швидкість мережі. |
| `Error: net::ERR_INSUFFICIENT_RESOURCES` | Недостатньо ресурсів системи | Оптимізуйте налаштування Puppeteer, зменшивши використання пам'яті. |
| Помилки пошуку елементів | Зміна структури сторінки Monobank | Оновіть селектори відповідно до нової структури сторінки. Використовуйте резервні методи пошуку елементів. |

#### 2. Рішення для діагностики

1. **Збереження скріншотів**:
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     await page.screenshot({ path: 'monobank-error.png' });
     console.error('Screenshot saved to monobank-error.png');
   }
   ```

2. **Виведення вмісту сторінки**:
   ```typescript
   const pageContent = await page.content();
   console.log('Page content:', pageContent);
   ```

3. **Включення детального логування Puppeteer**:
   ```typescript
   const browser = await puppeteer.launch({
     // інші опції
     dumpio: true  // Виводить stdout і stderr з браузера в консоль
   });
   ```

## Тестування

### Структура тестування

Рекомендована структура тестування для бекенду:

1. **Юніт-тести**:
   - Функція `retry`
   - Функція `checkUrlAvailability`
   - Функції валідації даних

2. **Інтеграційні тести**:
   - Тестування API з моками Puppeteer
   - Перевірка rate limiting
   - Перевірка параметрів безпеки

3. **E2E тести**:
   - Тестування повного потоку даних з реальним Monobank API
   - Перевірка коректності парсингу

### Приклад тесту для функції retry

```typescript
import { expect } from 'chai';
import sinon from 'sinon';

describe('retry function', () => {
  it('should return result on successful call', async () => {
    const fn = sinon.stub().resolves('success');
    const result = await retry(fn, 3, 10);
    expect(result).to.equal('success');
    expect(fn.calledOnce).to.be.true;
  });

  it('should retry on network error', async () => {
    const networkError = new Error('net::err_connection_refused');
    const fn = sinon.stub()
      .onFirstCall().rejects(networkError)
      .onSecondCall().resolves('success');
    
    const result = await retry(fn, 3, 10);
    expect(result).to.equal('success');
    expect(fn.calledTwice).to.be.true;
  });

  it('should throw after max retries', async () => {
    const networkError = new Error('net::err_connection_refused');
    const fn = sinon.stub().rejects(networkError);
    
    try {
      await retry(fn, 3, 10);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(fn.callCount).to.equal(3);
      expect(error).to.equal(networkError);
    }
  });
});
```

## Масштабування

### Стратегії масштабування

1. **Горизонтальне масштабування**:
   - Розгортання декількох екземплярів бекенду за балансувальником навантаження
   - Використання розподіленого кешування (Redis, Memcached)
   - Централізоване логування та моніторинг

2. **Вертикальне масштабування**:
   - Збільшення ресурсів для обробки більшої кількості паралельних запитів
   - Оптимізація використання пам'яті Puppeteer

3. **Функціональне масштабування**:
   - Виділення парсингу в окремий мікросервіс
   - Впровадження черги завдань (RabbitMQ, Kafka) для асинхронної обробки
   - Кешування результатів для зменшення навантаження на Monobank

### Архітектура для масштабування

```
┌───────────┐         ┌────────────────┐        ┌───────────────┐      ┌────────────┐
│           │ HTTP    │                │        │               │      │            │
│ Клієнти   │────────►│ Load Balancer  │────────► API сервер 1  │──┐   │            │
│           │◄────────│                │◄───────│               │  │   │            │
└───────────┘ JSON    └────────────────┘        └───────────────┘  │   │            │
                              │                                     │   │            │
                              │                 ┌───────────────┐  │   │ Redis      │
                              │                 │               │  │   │            │
                              └────────────────►│ API сервер 2  │──┼──►│ (Кеш)      │
                                      │         │               │  │   │            │
                                      │         └───────────────┘  │   │            │
                                      │                            │   │            │
                                      │         ┌───────────────┐  │   │            │
                                      │         │               │  │   │            │
                                      └────────►│ API сервер N  │──┘   │            │
                                                │               │      │            │
                                                └───────────────┘      └────────────┘
```

## Метрики продуктивності

### Поточні метрики

| Операція | Середній час виконання | Пікове використання ресурсів |
|----------|------------------------|------------------------------|
| Перевірка доступності URL | ~200-500 мс | Низьке |
| Ініціалізація Puppeteer | ~1-2 секунди | Середнє |
| Завантаження сторінки | ~2-5 секунд | Високе |
| Парсинг даних | ~500 мс | Низьке |
| Загальний час обробки запиту | ~3-7 секунд | Середнє |

### Рекомендації з оптимізації

1. **Кешування результатів** для популярних сторінок зборів
2. **Оптимізація налаштувань Puppeteer** для кращої продуктивності
3. **Впровадження черги запитів** для обробки високого навантаження
4. **Моніторинг критичних метрик** для виявлення вузьких місць
5. **Паралельна обробка запитів** на окремих серверах

## Рекомендації щодо розгортання

1. **Налаштування змінних оточення** (особливо `ALLOWED_ORIGINS` для безпеки)
2. **Запуск за процесним менеджером** (pm2 або systemd для надійності)
3. **Налаштування зворотного проксі** (nginx/apache) з SSL-сертифікатами
4. **Моніторинг** на потенційні DoS атаки та аномальну активність

### Приклад конфігурації PM2

```json
{
  "apps": [
    {
      "name": "monobank-donate-backend",
      "script": "dist/index.js",
      "instances": "max",
      "exec_mode": "cluster",
      "watch": false,
      "max_memory_restart": "300M",
      "env": {
        "NODE_ENV": "production"
      }
    }
  ]
}
```

### Приклад конфігурації Nginx

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name api.your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Захист від DoS атак
        limit_req zone=api burst=20 nodelay;
        limit_conn addr 10;
    }
}
```

## Плани з розвитку

1. **Кешування результатів** для зменшення навантаження на Monobank
2. **Зберігання історії зборів** у базі даних для аналітики
3. **Розширення функціональності API** для більшої інформації про збори
4. **Моніторинг та логування** для відстеження помилок
5. **Контейнеризація** для спрощення розгортання
6. **Реалізація WebSocket API** для реального часу
7. **Інтеграція з іншими платформами зборів**
8. **Впровадження графіків та аналітики** 