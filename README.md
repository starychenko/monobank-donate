# 💛 Monobank Donate

![Monobank Donate](https://img.shields.io/badge/Monobank-Donate-yellow?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNyA1SDcgQSIvPjxwYXRoIGQ9Ik0xNyAyQTIgMiAwIDAgMSAxOSA0VjIwQTIgMiAwIDAgMSAxNyAyMkg3QTIgMiAwIDAgMSA1IDIwVjRBMiAyIDAgMCAxIDcgMkgxN1oiLz48cGF0aCBkPSJNMTIgMThMMTIgMTgiLz48L3N2Zz4=)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

**Monobank Donate** — сучасний веб-додаток для відстеження статусу благодійних зборів на платформі Monobank у режимі реального часу.

<p align="center">
  <a href="https://i.imgur.com/NFK7tWr.mp4" target="_blank">
    <img src="https://i.imgur.com/DKgngqK.png" alt="Monobank Donate Screenshot" width="600" />
  </a>
</p>

## 📌 Зміст
- [Особливості](#-особливості)
- [Технічний стек](#️-технічний-стек)
- [Архітектура проєкту](#️-архітектура-проєкту)
- [Інсталяція](#-інсталяція)
- [Налаштування](#️-налаштування-env)
- [API документація](#-api-документація)
- [Безпека](#-безпека)
- [Дизайн](#-дизайн)
- [Як зробити внесок](#-як-зробити-внесок)
- [Ліцензія](#-ліцензія)

## ✨ Особливості

- 🔄 **Автоматичне оновлення** — статус збору оновлюється в реальному часі з відліком часу до наступного оновлення
- 🔔 **Push-сповіщення** — отримуйте сповіщення про значні зміни у сумі збору
- 🌙 **Темний режим** — стильний дизайн з фірмовими кольорами Monobank (жовтий та чорний)
- 📱 **Адаптивний інтерфейс** — чудово виглядає на мобільних, планшетах та десктопах
- 🔍 **QR-код** — зручне посилання для швидкого переходу на сторінку збору
- 📊 **Прогрес-бар** — наочна візуалізація прогресу збору з анімацією
- 💵 **Детальна інформація** — доступні дані про поточну суму та ціль збору
- ✨ **Анімації** — плавні переходи між значеннями при оновленні сум та ефекти при взаємодії з елементами
- 🚀 **Висока продуктивність** — мемоізовані компоненти, оптимізований код
- 🔒 **Багаторівнева безпека** — захист від DoS атак, XSS-атак та інших вразливостей

## 🛠️ Технічний стек

### Frontend
- **React 19** з **TypeScript** — для створення інтерактивного UI
- **Vite** — швидкий і легкий інструмент збірки
- **Tailwind CSS** — для стилізації компонентів
- **CSS Variables** — для гнучкої стилізації та темізації
- **React QR Code** — генерація QR-кодів для швидкого доступу
- **Custom React Hooks** — для керування темою та станом додатку
- **Web Notifications API** — для відображення push-сповіщень
- **Service Workers** — для обробки сповіщень у фоновому режимі

### Backend
- **Node.js** з **Express** — для API сервера
- **TypeScript** — для типобезпечного коду
- **Puppeteer** — для парсингу сторінки збору Monobank
- **Express Validator** — валідація вхідних даних
- **Express XSS Sanitizer** — захист від XSS-атак
- **Express Rate Limit** — багаторівневий захист від DoS атак
- **Helmet** — встановлення безпечних HTTP-заголовків
- **CORS** — для безпечних крос-доменних запитів
- **Dotenv** — для роботи з середовищними змінними

## 🏗️ Архітектура проєкту

```
/monobank-donate
  ├─ backend/                      # Node.js/Express API сервер
  │  ├─ types/                     # TypeScript типи
  │  │  └─ express-xss-sanitizer.d.ts
  │  ├─ .env                       # Змінні оточення
  │  ├─ index.ts                   # Головний файл сервера
  │  ├─ package.json
  │  └─ tsconfig.json
  ├─ frontend/                     # React/TypeScript додаток (Vite)
  │  ├─ public/                    # Статичні файли
  │  │  ├─ mono-icon.svg           # Іконка Monobank
  │  │  └─ sw.js                   # Сервіс-воркер для сповіщень
  │  ├─ src/
  │  │  ├─ components/             # UI компоненти
  │  │  │  ├─ common/              # Загальні компоненти
  │  │  │  │  ├─ AnimatedValue.tsx # Компонент анімованих значень
  │  │  │  │  ├─ InfoCard.tsx      # Інформаційна картка
  │  │  │  │  ├─ NotificationPrompt.tsx # Запит дозволу на сповіщення
  │  │  │  │  └─ ProgressBar.tsx   # Компонент прогрес-бару
  │  │  │  ├─ donation/            # Компоненти для функціоналу донатів
  │  │  │  │  ├─ DonationCard.tsx  # Компонент картки з QR-кодом
  │  │  │  │  └─ StatusInfo.tsx    # Компонент статусу оновлення
  │  │  │  ├─ layout/              # Компоненти макету
  │  │  │  │  ├─ AboutSection.tsx  # Секція "Про проект"
  │  │  │  │  ├─ Footer.tsx        # Підвал сторінки
  │  │  │  │  └─ Header.tsx        # Заголовок сторінки
  │  │  │  └─ App.tsx              # Головний компонент додатку
  │  │  ├─ constants/              # Константи проекту
  │  │  │  └─ api.ts               # API константи
  │  │  ├─ hooks/                  # Кастомні React хуки
  │  │  │  ├─ useCountdown.ts      # Хук для зворотного відліку
  │  │  │  ├─ useDonationData.ts   # Хук для роботи з даними пожертв
  │  │  │  └─ useTheme.ts          # Хук для керування темою
  │  │  ├─ styles/                 # CSS стилі
  │  │  │  └─ tailwind.css         # Стилі Tailwind CSS
  │  │  ├─ types/                  # TypeScript типи
  │  │  │  ├─ donation.ts          # Типи для даних про донати
  │  │  │  └─ theme.ts             # Типи для теми
  │  │  ├─ utils/                  # Утиліти
  │  │  │  ├─ api.ts               # Функції для роботи з API
  │  │  │  ├─ formatters.ts        # Функції форматування
  │  │  │  └─ notifications.ts     # Функції для роботи зі сповіщеннями
  │  │  ├─ main.tsx                # Вхідна точка додатку
  │  │  └─ vite-env.d.ts           # Типи для Vite
  │  ├─ .env                       # Змінні оточення
  │  ├─ eslint.config.js           # Конфігурація ESLint
  │  ├─ index.html                 # Головний HTML файл
  │  ├─ package.json
  │  ├─ postcss.config.cjs         # Конфігурація PostCSS
  │  ├─ tailwind.config.js         # Конфігурація Tailwind CSS
  │  ├─ tsconfig.app.json          # Конфігурація TypeScript для додатку
  │  ├─ tsconfig.json              # Базова конфігурація TypeScript
  │  ├─ tsconfig.node.json         # Конфігурація TypeScript для Node.js
  │  └─ vite.config.ts             # Конфігурація Vite
  ├─ .gitattributes
  ├─ .gitignore
  ├─ README.md                     # Документація проекту
  └─ setup.js                      # Скрипт для налаштування проекту
```

## 🚀 Інсталяція

### Вимоги
- Node.js (версія 16+)
- npm або yarn

### Автоматичне налаштування (рекомендовано)

```bash
# Клонувати репозиторій
git clone https://github.com/starychenko/monobank-donate.git
cd monobank-donate

# Запустити скрипт налаштування
node setup.js
```

Скрипт автоматично:
- Встановить залежності для frontend і backend
- Створить файли .env з шаблонів
- Допоможе налаштувати ключові параметри
- Запропонує запустити обидві частини проекту

### Ручне налаштування

#### Backend

```bash
cd backend
npm install
cp .env.example .env  # Створіть і відредагуйте .env файл
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # Створіть і відредагуйте .env файл
npm run dev
```

## ⚙️ Налаштування (.env)

### Frontend
```
# URL API
VITE_API_URL=http://localhost:3001/api/parse-monobank

# URL збору Monobank
VITE_MONOBANK_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Інтервал оновлення в мс (15 секунд)
VITE_UPDATE_INTERVAL=15000
```

### Backend
```
# Порт сервера
PORT=3001

# URL банки за замовчуванням
DEFAULT_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Кешування
CACHE_TTL=15

# Безпека
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# Режим для розробки
NODE_ENV=development
```

## 📋 API Документація

### Парсинг даних про збір

**Запит:**
```http
POST /api/parse-monobank
Content-Type: application/json

{
  "url": "https://send.monobank.ua/jar/YOUR_JAR_ID"
}
```

**Відповідь:**
```json
{
  "title": "Назва збору",
  "collected": "48 710 ₴",
  "target": "150 000 ₴"
}
```

## 🔒 Безпека

Проєкт включає кілька рівнів захисту:

### Захист від DoS атак
- **Багаторівнева система обмежень** — різні ліміти для різних типів запитів
- **Глобальні ліміти** — базові обмеження для всіх API ендпоінтів
- **Специфічні ліміти** — суворіші обмеження для ресурсомістких операцій
- **Захист від брутфорсу** — виявлення та блокування підозрілої активності
- **Адаптивні налаштування** — різні ліміти для розробки та виробництва

### Оптимізація продуктивності
- **React.memo** — мемоізація компонентів для запобігання зайвим рендерам
- **Оптимізовані хуки** — ефективне управління станом та ефектами
- **JSDoc документація** — детальний опис всіх компонентів та хуків
- **Плавні анімації** — якісний UX з візуальним фідбеком

### Захист від атак
- **XSS-захист** — санітизація всіх вхідних даних
- **Безпечні HTTP-заголовки** — налаштовані через Helmet
- **Валідація даних** — перевірка всіх вхідних параметрів
- **CORS налаштування** — обмеження дозволених доменів

## 🎨 Дизайн

Додаток використовує фірмовий стиль Monobank:

- **Жовтий**: `#FFD100` — основний акцентний колір
- **Чорний**: `#111111` — колір фону для темного режиму
- **Адаптивний дизайн** — оптимізовано для всіх типів пристроїв
- **Анімації** — плавні переходи для покращення взаємодії

### Інтерактивність
- **Плавні анімації значень** — при оновленні сум збору
- **Анімований прогрес-бар** — візуалізація поточного стану збору
- **Ефект наближення** — елементи ледь збільшуються при наведенні курсора
- **Тіні та переходи** — посилення візуального сприйняття при взаємодії
- **Push-сповіщення** — інформування про важливі зміни в зборі

## 🧩 Як зробити внесок

1. Зробіть форк репозиторію
2. Створіть гілку для вашої функції (`git checkout -b feature/amazing-feature`)
3. Закомітьте зміни (`git commit -m 'Add some amazing feature'`)
4. Відправте зміни у репозиторій (`git push origin feature/amazing-feature`)
5. Відкрийте Pull Request

## 📄 Ліцензія

Цей проєкт розповсюджується під ліцензією MIT. Див. файл `LICENSE` для докладнішої інформації.

---

<p align="center">
  Розроблено з ❤️ для підтримки благодійних зборів в Україні 💙💛
</p> 