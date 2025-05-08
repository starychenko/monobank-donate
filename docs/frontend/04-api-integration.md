# API Інтеграція фронтенд-частини

**Навігація по документації:**
- 📁 **Frontend:**
  - [Загальний огляд](01-overview.md)
  - [Компоненти](02-components.md)
  - [Хуки](03-hooks.md)
  - **[API Інтеграція (поточний документ)](04-api-integration.md)**
  - [Стилізація та UI](05-styling-ui.md)
  - [Типи](06-types.md)
  - [Service Workers](07-service-workers.md)
- 📁 **Backend:**
  - [Документація бекенду](../backend/backend.md)
- [🔙 На головну](../../README.md)

---

## Загальний огляд взаємодії з API

Фронтенд Monobank Donate взаємодіє з бекендом через REST API для отримання даних про стан збору коштів. Взаємодія побудована на основі HTTP-запитів з використанням fetch API.

## Структура модулів

Код для взаємодії з API організований у наступних файлах:

```
src/
├─ constants/
│  └─ api.ts       # Константи API (базовий URL, шляхи, інтервали оновлення)
├─ utils/
│  └─ api.ts       # Утиліти для взаємодії з API
└─ hooks/
   └─ useDonationData.ts  # Хук для роботи з даними збору
```

## Константи API

Файл `constants/api.ts` містить основні налаштування API:

```typescript
// src/constants/api.ts

export const API_BASE_URL = 'http://localhost:3001';

export const API_PATHS = {
  PARSE_MONOBANK: '/api/parse-monobank',
};

export const DEFAULT_JAR_URL = import.meta.env.VITE_DEFAULT_JAR_URL || '';

// Інтервал оновлення даних (у мілісекундах)
export const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 хвилин

// Мінімальна різниця сум для показу сповіщення (у гривнях)
export const NOTIFICATION_THRESHOLD = 500;
```

> **Примітка:** URL API сервера тепер жорстко закодований у коді як `http://localhost:3001/api/parse-monobank` і не налаштовується через змінні оточення.

## Утиліти для API

Файл `utils/api.ts` містить функції для виконання запитів до API:

```typescript
// src/utils/api.ts
import { API_BASE_URL, API_PATHS } from '../constants/api';
import type { DonationData } from '../types/donation';

/**
 * Функція для отримання даних про збір з API
 * @param jarUrl URL банки Monobank
 * @returns Promise з даними по збору
 */
export async function fetchDonationData(jarUrl: string): Promise<DonationData> {
  try {
    // Кодування URL як параметра запиту
    const encodedUrl = encodeURIComponent(jarUrl);
    const url = `${API_BASE_URL}${API_PATHS.PARSE_MONOBANK}?url=${encodedUrl}`;
    
    const response = await fetch(url);
    
    // Перевірка статусу відповіді
    if (!response.ok) {
      throw new Error(`HTTP помилка: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Помилка при отриманні даних збору:', error);
    throw error;
  }
}

/**
 * Функція для перевірки доступності API
 * @returns Promise<boolean> - чи доступний API
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
```

## Інтеграція з хуками

Хук `useDonationData` використовує утиліти API для отримання даних:

```typescript
// src/hooks/useDonationData.ts (фрагмент)
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDonationData } from '../utils/api';
import { UPDATE_INTERVAL } from '../constants/api';
import type { DonationData } from '../types/donation';

export function useDonationData(jarUrl: string) {
  // ...

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDonationData(jarUrl);
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося отримати дані');
    } finally {
      setLoading(false);
    }
  }, [jarUrl]);

  // Початкове завантаження
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Періодичне оновлення
  useEffect(() => {
    const intervalId = setInterval(fetchData, UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // ...
}
```

## Обробка відповідей API

### Структура відповіді API

Відповідь API має наступну структуру:

```typescript
interface DonationData {
  title: string;      // Назва збору
  collected: string;  // Зібрана сума (форматована)
  target: string;     // Цільова сума (форматована)
  rawCollected: number; // Зібрана сума (число)
  rawTarget: number;    // Цільова сума (число)
  percentage: number;   // Відсоток зібраного (0-100)
}
```

### Обробка помилок

Основні типи помилок, які можуть виникнути при взаємодії з API:

1. **Мережеві помилки** - проблеми з підключенням до сервера
2. **HTTP помилки** - відповіді з кодами 4xx та 5xx
3. **Помилки парсингу** - некоректний формат відповіді

Обробка помилок відбувається з використанням try/catch блоків та перевірки статусу відповіді:

```typescript
try {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP помилка: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Помилка при отриманні даних збору:', error);
  
  // Перетворення помилки у зрозуміле для користувача повідомлення
  const userFriendlyMessage = getUserFriendlyErrorMessage(error);
  throw new Error(userFriendlyMessage);
}

function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return 'Не вдалося підключитися до сервера. Перевірте підключення до інтернету.';
  }
  
  if (error instanceof Error) {
    if (error.message.includes('404')) {
      return 'Сервер не знайдено. Перевірте URL API.';
    }
    if (error.message.includes('500')) {
      return 'Помилка на сервері. Спробуйте пізніше.';
    }
    return error.message;
  }
  
  return 'Сталася невідома помилка';
}
```

## Стан завантаження та індикатори

Для інформування користувача про стан взаємодії з API використовуються змінні стану:

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
```

Ці змінні використовуються в компонентах для відображення:

```tsx
// Компонент, який використовує хук useDonationData
function DonationStatus() {
  const { data, loading, error, lastUpdated } = useDonationData(jarUrl);
  
  return (
    <div>
      {loading && <LoadingSpinner />}
      
      {error && <ErrorMessage message={error} />}
      
      {!loading && !error && (
        <DonationInfo 
          data={data} 
          lastUpdated={lastUpdated} 
        />
      )}
    </div>
  );
}
```

## Кешування та оптимізація

### Локальне кешування

Для оптимізації взаємодії з API можна використовувати локальне кешування в хуках:

```typescript
const cachedDataRef = useRef<{
  data: DonationData | null;
  timestamp: number;
}>({
  data: null,
  timestamp: 0
});

const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  const now = Date.now();
  const cacheAge = now - cachedDataRef.current.timestamp;
  const isCacheValid = cachedDataRef.current.data && cacheAge < CACHE_TTL;
  
  // Використовуємо кеш, якщо він валідний і не потрібне примусове оновлення
  if (isCacheValid && !forceRefresh) {
    setData(cachedDataRef.current.data);
    setLoading(false);
    return;
  }
  
  try {
    const result = await fetchDonationData(jarUrl);
    
    // Оновлюємо кеш
    cachedDataRef.current = {
      data: result,
      timestamp: now
    };
    
    setData(result);
    setLastUpdated(new Date());
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Не вдалося отримати дані');
  } finally {
    setLoading(false);
  }
}, [jarUrl, forceRefresh]);
```

### Abort Controller

Для скасування попередніх запитів при зміні URL або примусовому оновленні:

```typescript
const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);
  
  // Створюємо новий AbortController для цього запиту
  const abortController = new AbortController();
  const signal = abortController.signal;
  
  // Скасовуємо попередній запит, якщо він ще виконується
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  // Зберігаємо поточний AbortController
  abortControllerRef.current = abortController;
  
  try {
    const result = await fetchDonationData(jarUrl, signal);
    
    // Перевіряємо, чи запит не був скасований
    if (!signal.aborted) {
      setData(result);
      setLastUpdated(new Date());
    }
  } catch (err) {
    // Ігноруємо помилки від скасованих запитів
    if (err.name !== 'AbortError') {
      setError(err instanceof Error ? err.message : 'Не вдалося отримати дані');
    }
  } finally {
    if (!signal.aborted) {
      setLoading(false);
    }
  }
}, [jarUrl]);
```

## CORS та безпека

### Конфігурація CORS

Бекенд має бути налаштований для прийняття CORS-запитів з домену фронтенду:

```typescript
// backend/index.ts
import cors from 'cors';

const app = express();

// Налаштування CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Не дозволено CORS'));
    }
  }
}));
```

### Безпека запитів

Рекомендації щодо безпечної взаємодії з API:

1. **Валідація вхідних даних** перед відправкою на сервер
2. **Санітизація отриманих даних** перед використанням у DOM
3. **Використання HTTPS** для шифрування трафіку
4. **Обробка конфіденційних даних** згідно з вимогами безпеки

## Інтеграційне тестування

Приклад тесту для перевірки взаємодії з API:

```typescript
// __tests__/api.test.ts
import { fetchDonationData } from '../src/utils/api';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Моковий сервер для імітації API
const server = setupServer(
  rest.get('*/api/parse-monobank', (req, res, ctx) => {
    return res(
      ctx.json({
        title: 'Тестовий збір',
        collected: '1000 ₴',
        target: '10000 ₴',
        rawCollected: 1000,
        rawTarget: 10000,
        percentage: 10
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('fetchDonationData повертає дані про збір', async () => {
  const data = await fetchDonationData('https://send.monobank.ua/jar/example');
  
  expect(data).toEqual({
    title: 'Тестовий збір',
    collected: '1000 ₴',
    target: '10000 ₴',
    rawCollected: 1000,
    rawTarget: 10000,
    percentage: 10
  });
});

test('fetchDonationData обробляє помилки API', async () => {
  server.use(
    rest.get('*/api/parse-monobank', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );
  
  await expect(fetchDonationData('https://send.monobank.ua/jar/example'))
    .rejects
    .toThrow('HTTP помилка: 500');
});
```

## Моніторинг та логування

Рекомендації щодо моніторингу взаємодії з API:

1. **Консольне логування** для розробки та налагодження
2. **Телеметрія** для відстеження продуктивності у продакшені
3. **Аналітика помилок** для виявлення та виправлення проблем

Приклад логування:

```typescript
export async function fetchDonationData(jarUrl: string): Promise<DonationData> {
  const startTime = performance.now();
  
  try {
    console.log(`[API] Запит даних для ${jarUrl}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[API] HTTP помилка: ${response.status}`);
      throw new Error(`HTTP помилка: ${response.status}`);
    }
    
    const data = await response.json();
    
    const endTime = performance.now();
    console.log(`[API] Успішно отримано дані за ${endTime - startTime}ms`);
    
    return data;
  } catch (error) {
    console.error('[API] Помилка при отриманні даних збору:', error);
    throw error;
  }
}
``` 