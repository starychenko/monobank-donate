# Компоненти

## Загальна структура компонентів

Фронтенд-частина проекту організована навколо компонентного підходу React. Компоненти розділені на логічні групи:

```
src/components/
├─ common/                # Загальні UI компоненти
│  ├─ AnimatedValue.tsx   # Анімація значень
│  ├─ InfoCard.tsx        # Інформаційна картка
│  ├─ NotificationPrompt.tsx # Запит дозволу на сповіщення
│  └─ ProgressBar.tsx     # Компонент прогрес-бару
├─ donation/              # Компоненти для даних збору
│  ├─ DonationCard.tsx    # Карта з QR-кодом і прогресом
│  └─ StatusInfo.tsx      # Статус оновлення
├─ layout/                # Структурні компоненти
│  ├─ AboutSection.tsx    # Секція "Про проект"
│  ├─ Footer.tsx          # Підвал сторінки
│  └─ Header.tsx          # Заголовок сторінки
└─ App.tsx                # Головний компонент
```

## Ієрархія компонентів

Ієрархія відображає відношення батьківських і дочірніх компонентів:

```
App
├── Header
├── DonationCard
│   └── ProgressBar
├── StatusInfo
│   └── AnimatedValue
├── InfoCard
├── AboutSection
├── Footer
└── NotificationPrompt
```

## Основні компоненти

### App.tsx

Головний компонент додатку, який об'єднує всі інші компоненти і керує станом додатку.

**Відповідальність:**
- Ініціалізація хуку `useDonationData` для отримання даних
- Відстеження змін у сумі збору для сповіщень
- Керування темою додатку через хук `useTheme`
- Реєстрація service worker для сповіщень

**Приклад використання:**
```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './components/App';
import './styles/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### common/AnimatedValue.tsx

Компонент для плавної анімації зміни числових значень.

**Пропси:**
- `value: string` - значення, яке треба відображати
- `className?: string` - додаткові CSS класи (опціонально)

**Функціональність:**
- Конвертація рядкового значення в число для анімації
- Плавна анімація зміни значень за допомогою React Spring
- Форматування числа з роздільниками розрядів

**Приклад використання:**
```tsx
<AnimatedValue value="48 710 ₴" className="text-2xl font-bold" />
```

### common/ProgressBar.tsx

Компонент для візуалізації прогресу збору.

**Пропси:**
- `progress: number` - прогрес у відсотках (0-100)
- `className?: string` - додаткові CSS класи (опціонально)

**Функціональність:**
- Візуалізація прогресу у вигляді заповненої смуги
- Анімація зміни прогресу
- Адаптивний дизайн

**Приклад використання:**
```tsx
<ProgressBar progress={45} className="mt-4" />
```

### donation/DonationCard.tsx

Компонент для відображення інформації про збір та QR-коду.

**Пропси:**
- `collected?: string` - зібрана сума
- `target?: string` - цільова сума
- `jarUrl: string` - посилання на банку Monobank
- `progress: number` - прогрес у відсотках (0-100)

**Функціональність:**
- Відображення зібраної та цільової суми
- Генерація QR-коду для швидкого переходу на сторінку збору
- Відображення прогрес-бару

**Приклад використання:**
```tsx
<DonationCard 
  collected="48 710 ₴"
  target="150 000 ₴"
  jarUrl="https://send.monobank.ua/jar/123456789"
  progress={32}
/>
```

### donation/StatusInfo.tsx

Компонент для відображення інформації про стан оновлення даних.

**Пропси:**
- `loading: boolean` - чи відбувається завантаження даних
- `error: string | null` - помилка, якщо є
- `lastUpdated?: Date` - час останнього успішного оновлення
- `updateInterval: number` - інтервал між автоматичними оновленнями (мс)
- `onCountdownComplete: () => void` - функція, яка викликається після закінчення зворотного відліку

**Функціональність:**
- Відображення статусу завантаження даних
- Показ помилок при їх виникненні
- Відображення часу останнього оновлення
- Зворотний відлік до наступного оновлення
- Кнопка для ручного оновлення даних

**Приклад використання:**
```tsx
<StatusInfo 
  loading={loading}
  error={error}
  lastUpdated={lastUpdated}
  updateInterval={15000}
  onCountdownComplete={triggerUpdate}
/>
```

### layout/Header.tsx

Компонент заголовка сторінки з перемикачем теми.

**Пропси:**
- `theme: 'light' | 'dark'` - поточна тема
- `onToggleTheme: () => void` - функція для перемикання теми

**Функціональність:**
- Відображення логотипу та назви проекту
- Перемикач теми (світла/темна)

**Приклад використання:**
```tsx
<Header theme={theme} onToggleTheme={toggleTheme} />
```

## Патерни використання компонентів

### Композиція компонентів

У проекті активно використовується композиція компонентів для створення складних інтерфейсів:

```tsx
<DonationCard>
  <div className="card-header">Збір коштів</div>
  <ProgressBar progress={progress} />
  <QRCode value={jarUrl} />
</DonationCard>
```

### Мемоізація компонентів

Для оптимізації продуктивності використовується `React.memo`:

```tsx
export const ProgressBar = React.memo(function ProgressBar({
  progress,
  className = '',
}: ProgressBarProps) {
  // Реалізація компонента
});
```

### Prop Drilling vs Context

У проекті балансуються два підходи:
- **Prop Drilling** - для неглибоких ієрархій
- **React Context** - для глобальних даних, таких як тема

### Умовний рендеринг

Для різних станів компонентів використовується умовний рендеринг:

```tsx
{loading ? (
  <div className="loading-spinner">Завантаження...</div>
) : error ? (
  <div className="error-message">{error}</div>
) : (
  <AnimatedValue value={collected} />
)}
```

## Стилізація компонентів

### Tailwind CSS підхід

Усі компоненти використовують Tailwind CSS для стилізації:

```tsx
<div className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
    {title}
  </h2>
  {/* Інший вміст */}
</div>
```

### Темізація

Підтримка світлої та темної теми реалізована через класи:

```tsx
<div className={`app-container ${theme}`}>
  {/* Компоненти додатку */}
</div>
```

## Тестування компонентів

Рекомендовані підходи до тестування компонентів:

1. **Unit тести** для окремих компонентів
2. **Snapshot тести** для перевірки UI
3. **Integration тести** для взаємодії між компонентами

Приклад тесту з використанням React Testing Library:

```tsx
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct progress percentage', () => {
    render(<ProgressBar progress={75} />);
    const progressElement = screen.getByRole('progressbar');
    expect(progressElement).toHaveAttribute('aria-valuenow', '75');
  });
});
```

## Найкращі практики

1. **Розділення відповідальності** - кожен компонент повинен мати чітку відповідальність
2. **Типізація пропсів** - використання TypeScript для визначення типу пропсів
3. **Деструктуризація пропсів** - для кращої читабельності коду
4. **Умовний рендеринг** - для відображення різних станів компонента
5. **Повторне використання компонентів** - через композицію та прості, контрольовані компоненти
6. **Дрібні компоненти** - меньші компоненти простіше тестувати та повторно використовувати
7. **Семантичні імена** - компоненти і пропси повинні мати зрозумілі, семантичні імена 