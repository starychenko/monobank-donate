# monobank-donate

Веб-додаток для відстеження статусу збору донатів у Monobank.

## Структура проекту

- `/frontend` — сучасний адаптивний сайт (React, Vite, TailwindCSS)
- `/backend` — сервер для парсингу сторінки Monobank (Node.js, Express, Puppeteer)

## Запуск

### Frontend
1. Перейдіть у папку `frontend`
2. Створіть `.env` (див. приклад нижче)
3. Встановіть залежності: `npm install`
4. Запустіть: `npm run dev`

### Backend
1. Перейдіть у папку `backend`
2. Створіть `.env` (див. приклад нижче)
3. Встановіть залежності: `npm install`
4. Запустіть: `npm run dev`

## Приклад .env для фронтенду
```
VITE_MONOBANK_JAR_URL=https://send.monobank.ua/jar/58vdbegH3T
VITE_UPDATE_INTERVAL=15000
VITE_API_URL=http://localhost:3001/api/parse-monobank
```

## Приклад .env для бекенду
```
PORT=3001
DEFAULT_JAR_URL=https://send.monobank.ua/jar/58vdbegH3T
CACHE_TTL=15
```

---

- UI адаптивний, у стилі Monobank, з підтримкою мобільних, десктопів і 4K.
- Дані оновлюються автоматично з інтервалом із .env.
- QR-код генерується для посилання на банку. 