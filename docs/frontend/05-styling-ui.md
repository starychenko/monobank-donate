# Стилізація та UI

## Загальний підхід

Фронтенд Monobank Donate використовує модерний підхід до стилізації з використанням Tailwind CSS - utility-first CSS фреймворку. Такий підхід дозволяє швидко створювати чисті, адаптивні інтерфейси без необхідності писати власні CSS-правила.

## Технології стилізації

### Tailwind CSS

Проект використовує Tailwind CSS для стилізації компонентів:

```
frontend/
├─ tailwind.config.js  # Конфігурація Tailwind
├─ postcss.config.cjs  # Конфігурація PostCSS
└─ src/
   └─ styles/
      └─ tailwind.css  # Головний CSS файл з директивами Tailwind
```

### Конфігурація Tailwind

Файл `tailwind.config.js` містить налаштування Tailwind для проекту:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Налаштування для темної теми
  theme: {
    extend: {
      colors: {
        // Кольори бренду Monobank
        primary: '#1b1c21',
        secondary: '#ffd166',
        accent: '#3dc6c3',
        mono: {
          black: '#1b1c21',
          gray: '#808080',
          light: '#fafafa',
          yellow: '#ffd166',
          green: '#3dc6c3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      animation: {
        'progress': 'progress 1.5s ease-in-out',
        'fade-in': 'fade-in 0.3s ease-in',
        'fade-out': 'fade-out 0.3s ease-out',
      },
      keyframes: {
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
```

### Основний CSS файл

Файл `src/styles/tailwind.css` містить директиви Tailwind та базові стилі:

```css
/* src/styles/tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Базові стилі */
@layer base {
  body {
    @apply bg-white dark:bg-primary text-primary dark:text-white font-sans transition-colors duration-200;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-bold;
  }
  
  button {
    @apply transition-colors duration-200;
  }
}

/* Кастомні компоненти */
@layer components {
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden;
  }
  
  .btn {
    @apply px-4 py-2 rounded-md font-medium transition-all;
  }
  
  .btn-primary {
    @apply bg-mono-yellow text-primary hover:bg-yellow-400;
  }
  
  .btn-secondary {
    @apply bg-mono-green text-white hover:bg-teal-500;
  }
}

/* Кастомні утиліти */
@layer utilities {
  .text-shadow {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}
```

## Дизайн-система

### Колірна палітра

Проект використовує кольори, що відповідають бренду Monobank:

- **Первинний колір**: `#1b1c21` (темно-сірий)
- **Вторинний колір**: `#ffd166` (жовтий)
- **Акцентний колір**: `#3dc6c3` (бірюзовий)

Додаткові кольори:
- **Сірий**: `#808080`
- **Світло-сірий**: `#fafafa`

### Темна/світла тема

Проект підтримує дві кольорові теми:

**Світла тема** (за замовчуванням):
- Фон: білий
- Текст: темно-сірий
- Картки: білий з тінями

**Темна тема**:
- Фон: темно-сірий (`#1b1c21`)
- Текст: білий
- Картки: темно-сірий з темними тінями

### Типографіка

У проекті використовується шрифт Inter з резервними Arial та sans-serif:

```css
font-family: 'Inter', 'Arial', sans-serif;
```

Розміри шрифтів:
- Заголовки: 1.5rem - 3rem
- Основний текст: 1rem
- Малий текст: 0.875rem

### Компоненти UI

Базові UI компоненти, що використовуються в проекті:

1. **Картки** - контейнери з тінями для групування вмісту
2. **Кнопки** - первинні та вторинні для дій
3. **Прогрес-бар** - для відображення прогресу збору
4. **Лічильники** - для анімованого відображення числових значень

### Відступи та розміри

Стандартні відступи в проекті:
- Малий: 0.5rem (8px)
- Середній: 1rem (16px)
- Великий: 1.5rem (24px)
- Дуже великий: 2rem (32px)

## Адаптивний дизайн

Проект використовує адаптивний дизайн для підтримки різних розмірів екранів:

### Контрольні точки (breakpoints)

За замовчуванням в Tailwind використовуються такі контрольні точки:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Приклади адаптивного коду

```jsx
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2 p-4">
    <h2 className="text-xl md:text-2xl lg:text-3xl">Заголовок</h2>
    <p className="text-sm md:text-base">Текст</p>
  </div>
  
  <div className="w-full md:w-1/2 p-4">
    {/* Вміст */}
  </div>
</div>
```

## Анімації

Проект використовує анімації для покращення UX:

### Вбудовані анімації Tailwind

```jsx
<div className="transition-all duration-300 hover:scale-105">
  Анімований при наведенні елемент
</div>
```

### Користувацькі анімації

```jsx
<div className="animate-progress">
  Анімація прогресу
</div>

<div className="animate-fade-in">
  Плавна поява
</div>
```

### React Spring

Для складних анімацій використовується бібліотека React Spring:

```jsx
import { useSpring, animated } from 'react-spring';

function AnimatedCounter({ value }) {
  const { number } = useSpring({
    from: { number: 0 },
    to: { number: value },
    config: { duration: 1000 },
  });

  return (
    <animated.div>
      {number.to(n => n.toFixed(0))}
    </animated.div>
  );
}
```

## Доступність (a11y)

Рекомендації щодо доступності UI:

### Семантичні HTML теги

```jsx
<header>
  <h1>Заголовок сторінки</h1>
</header>

<main>
  <section aria-labelledby="section-title">
    <h2 id="section-title">Заголовок секції</h2>
    <p>Вміст</p>
  </section>
</main>

<footer>
  <p>Підвал</p>
</footer>
```

### Контраст кольорів

Проект гарантує достатній контраст між текстом та фоном:

- Темний текст на світлому фоні (співвідношення контрасту >= 4.5:1)
- Світлий текст на темному фоні (співвідношення контрасту >= 4.5:1)

### Фокус на елементах

```css
@layer base {
  *:focus-visible {
    @apply outline-2 outline-offset-2 outline-mono-yellow;
  }
}
```

### ARIA атрибути

```jsx
<button
  aria-label="Оновити дані"
  aria-pressed={isUpdating}
  onClick={handleUpdate}
>
  <Icon name="refresh" />
</button>
```

## Іконки та зображення

### SVG іконки

Проект використовує SVG-іконки для UI елементів:

```jsx
function Icon({ name, className = '' }) {
  const icons = {
    refresh: (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
      </svg>
    ),
    // інші іконки
  };
  
  return icons[name] || null;
}
```

### Оптимізація зображень

Техніки оптимізації зображень у проекті:

1. **Використання WebP** для зменшення розміру файлів
2. **Lazy Loading** для відкладеного завантаження зображень
3. **Респонсивні розміри** для різних пристроїв

```jsx
<img
  src="/mono-icon.svg"
  alt="Monobank Logo"
  width="32"
  height="32"
  loading="lazy"
/>
```

## Найкращі практики стилізації

1. **Мобільна версія в пріоритеті** - починайте з мобільної версії, потім адаптуйте для більших екранів
2. **Уникайте інлайн-стилів** - використовуйте класи Tailwind
3. **Перевикористовуйте компоненти** - створюйте узгоджені, повторно використовувані UI елементи
4. **Дотримуйтесь доступності** - забезпечте доступність інтерфейсу для всіх користувачів
5. **Тестуйте на різних пристроях** - перевіряйте на різних розмірах екранів і браузерах
6. **Оптимізуйте продуктивність** - мінімізуйте кількість CSS і JS
7. **Використовуйте дизайн-токени** - зберігайте значення кольорів, розмірів та інших властивостей в змінних

## Приклади використання

### Картка з тінню

```jsx
<div className="card p-6 my-4">
  <h3 className="text-xl font-bold mb-2">Заголовок картки</h3>
  <p className="text-gray-700 dark:text-gray-300">
    Текст картки
  </p>
</div>
```

### Кнопка з іконкою

```jsx
<button className="btn btn-primary flex items-center gap-2">
  <Icon name="refresh" className="w-4 h-4" />
  <span>Оновити</span>
</button>
```

### Адаптивна сітка

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="card p-4">Елемент 1</div>
  <div className="card p-4">Елемент 2</div>
  <div className="card p-4">Елемент 3</div>
</div>
``` 