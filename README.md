# 💛 Monobank Donate

![Monobank Donate](https://img.shields.io/badge/Monobank-Donate-yellow?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNyA1SDcgQSIvPjxwYXRoIGQ9Ik0xNyAyQTIgMiAwIDAgMSAxOSA0VjIwQTIgMiAwIDAgMSAxNyAyMkg3QTIgMiAwIDAgMSA1IDIwVjRBMiAyIDAgMCAxIDcgMkgxN1oiLz48cGF0aCBkPSJNMTIgMThMMTIgMTgiLz48L3N2Zz4=)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

Сучасний веб-додаток для відстеження статусу збору донатів на платформі Monobank у режимі реального часу, створений для підтримки благодійних зборів.

<p align="center">
  <a href="https://i.imgur.com/NFK7tWr.mp4" target="_blank">
    <img src="https://i.imgur.com/DKgngqK.png" alt="Monobank Donate Screenshot" width="600" />
  </a>
</p>

## ✨ Особливості

- 🔄 **Автоматичне оновлення** — статус збору оновлюється автоматично з відліком часу
- 🌙 **Офіційний дизайн** — темна тема з фірмовими кольорами Monobank (жовтий та чорний)
- 📱 **Адаптивний інтерфейс** — оптимізовано для всіх типів пристроїв (мобільні, планшети, десктопи)
- 🔍 **QR-код** — зручне посилання для швидкого переходу на сторінку збору
- 📊 **Візуалізація прогресу** — наочний прогрес-бар з анімацією
- 💵 **Деталі збору** — повна інформація про поточну суму та ціль
- 🔒 **Безпека** — валідація запитів та захист від XSS-атак
- 🚀 **Висока продуктивність** — оптимізовані компоненти та швидкий час завантаження

## 🛠️ Технічний стек

### Frontend
- **React 18** з **TypeScript** — для створення інтерактивного UI
- **Vite** — швидкий і легкий інструмент збірки
- **Tailwind CSS** — для стилізації компонентів
- **CSS Variables** — для гнучкої стилізації та темізації
- **React QR Code** — генерація QR-кодів для швидкого доступу
- **Custom React Hooks** — для керування темою та станом додатку

### Backend
- **Node.js** з **Express** — для API сервера
- **TypeScript** — для типобезпечного коду
- **Puppeteer** — для парсингу сторінки збору Monobank
- **Express Validator** — валідація вхідних даних
- **Express XSS Sanitizer** — захист від XSS-атак
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
  │  │  └─ mono-icon.svg           # Іконка Monobank
  │  ├─ src/
  │  │  ├─ components/             # UI компоненти
  │  │  │  ├─ common/              # Загальні компоненти
  │  │  │  │  ├─ InfoCard.tsx      # Інформаційна картка
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
  │  │  │  └─ formatters.ts        # Функції форматування
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

## 🚀 Запуск проєкту

### Вимоги
- Node.js (версія 16+)
- npm або yarn

### Встановлення і запуск

#### Автоматичне налаштування (рекомендовано)

Для швидкого налаштування проекту використовуйте приготований скрипт:

```bash
git clone https://github.com/starychenko/monobank-donate.git
cd monobank-donate
node setup.js
```

Скрипт автоматично:
- Встановить залежності для frontend і backend
- Створить файли .env з шаблонів .env.example
- Допоможе налаштувати ключові параметри у файлах .env, зокрема:
  - ID банки Monobank для обох частин проекту
  - Порт сервера та інші параметри бекенду
  - URL API та інтервал оновлення для фронтенду
- Запропонує одразу запустити обидві частини проекту в окремих вікнах
- Надасть подальші інструкції для роботи з проектом

#### Ручне налаштування

1. **Клонувати репозиторій**
```bash
git clone https://github.com/starychenko/monobank-donate.git
cd monobank-donate
```

2. **Налаштувати та запустити Backend**
```bash
cd backend
npm install

# Створіть файл .env на основі прикладу
cp .env.example .env
# Відредагуйте .env файл зі своїми налаштуваннями

npm run dev
```

3. **Налаштувати та запустити Frontend**
```bash
cd frontend
npm install

# Створіть файл .env на основі прикладу
cp .env.example .env
# Відредагуйте .env файл зі своїми налаштуваннями

npm run dev
```

## ⚙️ Налаштування (.env)

### Frontend (.env.example)
```
# URL API
VITE_API_URL=http://localhost:3001/api/parse-monobank

# URL збору Monobank
VITE_MONOBANK_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Інтервал оновлення в мс (15 секунд)
VITE_UPDATE_INTERVAL=15000
```

### Backend (.env.example)
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

### Інструкції для налаштування

1. У папці `backend`:
   - Скопіюйте вміст прикладу в новий файл `.env`
   - Замініть `YOUR_JAR_ID` на фактичний ID банки Monobank
   - Налаштуйте інші параметри за потреби

2. У папці `frontend`:
   - Скопіюйте вміст прикладу в новий файл `.env`
   - Замініть `YOUR_JAR_ID` на фактичний ID банки Monobank
   - Перевірте URL API бекенду
   - Налаштуйте інтервал оновлення за потреби

## 📋 API Документація

### Парсинг даних про збір
```
POST /api/parse-monobank
```

**Тіло запиту:**
```json
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

## 🎨 Дизайн

Додаток використовує офіційні кольори Monobank:
- **Жовтий**: `#FFD100` — головний колір бренду
- **Чорний**: `#111111` — колір фону
- **Системні шрифти**: Оптимізований стек для кожної платформи

## 🤝 Як зробити внесок

1. Зробіть форк репозиторію
2. Створіть гілку з вашою функцією (`git checkout -b feature/amazing-feature`)
3. Зробіть коміт ваших змін (`git commit -m 'Add some amazing feature'`)
4. Відправте зміни до гілки (`git push origin feature/amazing-feature`)
5. Відкрийте Pull Request

## 📄 Ліцензія

Розповсюджується за ліцензією MIT. Дивіться файл `LICENSE` для детальної інформації.

---

<p align="center">
  Розроблено з ❤️ для підтримки благодійних зборів на платформі Monobank 💙💛
</p> 