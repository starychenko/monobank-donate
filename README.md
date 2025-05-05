# Monobank Donate

Веб-додаток для відстеження статусу збору донатів на платформі Monobank у режимі реального часу. 

## Особливості

- 🔄 **Автоматичне оновлення** статусу збору кожні 15 секунд
- 🌙 **Темна/світла тема** з автоматичним визначенням системних налаштувань
- 📱 **Адаптивний UI** для всіх типів пристроїв (мобільні, планшети, десктопи)
- 🔍 **QR-код** для швидкого переходу на сторінку збору
- 📊 **Прогрес-бар** для візуалізації статусу збору
- 💵 **Інформація про суми** (накопичено/ціль)

## Технічний стек

### Frontend
- **React** + **TypeScript** + **Vite** — швидкий та сучасний фреймворк
- **TailwindCSS** — для стилізації та адаптивності
- **React QR Code** — для генерації QR-кодів
- **Custom Hooks** — для керування темою та станом додатку

### Backend
- **Node.js** + **Express** — для серверної частини
- **Puppeteer** — для парсингу сторінки Monobank
- **CORS** + **dotenv** — для налаштувань і безпеки

## Структура проекту

```
/monobank-donate
  /frontend         # React додаток (Vite + TailwindCSS)
    /src
      /components   # React компоненти
      /hooks        # Кастомні React хуки
  /backend          # Node.js API сервер
```

## Запуск проекту

### Підготовка

Клонуйте репозиторій та встановіть залежності:

```bash
git clone https://github.com/starychenko/monobank-donate.git
cd monobank-donate
```

### Backend

```bash
cd backend
npm install
# Створіть файл .env (див. приклад нижче)
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Створіть файл .env (див. приклад нижче)
npm run dev
```

## Налаштування (.env)

### Frontend (.env)

```
VITE_MONOBANK_JAR_URL=https://send.monobank.ua/jar/58vdbegH3T
VITE_UPDATE_INTERVAL=15000
VITE_API_URL=http://localhost:3001/api/parse-monobank
```

### Backend (.env)

```
PORT=3001
DEFAULT_JAR_URL=https://send.monobank.ua/jar/58vdbegH3T
CACHE_TTL=15
```

## Як працює

1. **Backend** парсить задану сторінку збору Monobank за допомогою Puppeteer
2. **Frontend** відправляє запит на backend і отримує дані про збір
3. Дані автоматично оновлюються через заданий інтервал
4. Користувач може перемикати тему (темна/світла)
5. QR-код і прогрес-бар відображають актуальну інформацію про збір

## Ліцензія

MIT

---

Проект створено з 💜 для підтримки зборів коштів 