# Типи даних фронтенд-частини

**Навігація по документації:**
- 📁 **Frontend:**
  - [Загальний огляд](01-overview.md)
  - [Компоненти](02-components.md)
  - [Хуки](03-hooks.md)
  - [API Інтеграція](04-api-integration.md)
  - [Стилізація та UI](05-styling-ui.md)
  - **[Типи (поточний документ)](06-types.md)**
  - [Service Workers](07-service-workers.md)
- 📁 **Backend:**
  - [Документація бекенду](../backend/backend.md)
- [🔙 На головну](../../README.md)

---

## Система типізації

Проект Monobank Donate повністю типізований за допомогою TypeScript, що забезпечує надійність та зручність розробки. Система типів проекту організована в директорії `src/types/`, де зберігаються всі типи та інтерфейси.

```
src/types/
├─ donation.ts      # Типи для даних про збір
└─ theme.ts         # Типи для системи тем
```

## Основні типи та інтерфейси

### Типи даних збору

Файл `src/types/donation.ts` містить типи, пов'язані з даними збору:

```typescript
// src/types/donation.ts

/**
 * Інтерфейс для даних про збір коштів
 */
export interface DonationData {
  /** Назва збору */
  title: string;
  
  /** Зібрана сума (форматована) */
  collected: string;
  
  /** Цільова сума (форматована) */
  target: string;
  
  /** Зібрана сума (числове значення) */
  rawCollected: number;
  
  /** Цільова сума (числове значення) */
  rawTarget: number;
  
  /** Відсоток зібраного (0-100) */
  percentage: number;
  
  /** Опис збору (опціонально) */
  description?: string;
}

/**
 * Інтерфейс для стану даних збору
 */
export interface DonationDataState {
  /** Поточні дані збору */
  data: DonationData | null;
  
  /** Стан завантаження */
  loading: boolean;
  
  /** Помилка, якщо є */
  error: string | null;
  
  /** Час останнього оновлення */
  lastUpdated: Date | undefined;
}

/**
 * Тип для результату хуку useDonationData
 */
export interface UseDonationDataResult extends DonationDataState {
  /** Функція для примусового оновлення даних */
  triggerUpdate: () => void;
}

/**
 * Параметри для компонента DonationCard
 */
export interface DonationCardProps {
  /** Зібрана сума (форматована) */
  collected?: string;
  
  /** Цільова сума (форматована) */
  target?: string;
  
  /** URL банки Monobank */
  jarUrl: string;
  
  /** Прогрес збору (0-100) */
  progress: number;
  
  /** Додаткові класи CSS */
  className?: string;
}

/**
 * Параметри для компонента StatusInfo
 */
export interface StatusInfoProps {
  /** Стан завантаження */
  loading: boolean;
  
  /** Помилка, якщо є */
  error: string | null;
  
  /** Час останнього оновлення */
  lastUpdated?: Date;
  
  /** Інтервал оновлення в мілісекундах */
  updateInterval: number;
  
  /** Функція, що викликається при завершенні зворотного відліку */
  onCountdownComplete: () => void;
}

/**
 * Тип для повідомлення про зміну збору
 */
export interface DonationChangeNotification {
  /** Попереднє значення зібраної суми */
  previousAmount: number;
  
  /** Нове значення зібраної суми */
  currentAmount: number;
  
  /** Різниця між поточною та попередньою сумою */
  difference: number;
  
  /** Дата оновлення */
  timestamp: Date;
}
```

### Типи для системи тем

Файл `src/types/theme.ts` містить типи, пов'язані з темою додатку:

```typescript
// src/types/theme.ts

/**
 * Доступні теми додатку
 */
export type Theme = 'light' | 'dark';

/**
 * Результат хуку useTheme
 */
export interface UseThemeResult {
  /** Поточна тема */
  theme: Theme;
  
  /** Функція для переключення теми */
  toggleTheme: () => void;
}

/**
 * Пропси для компонентів з темою
 */
export interface ThemeProps {
  /** Поточна тема */
  theme: Theme;
}

/**
 * Пропси для ThemeProvider
 */
export interface ThemeProviderProps {
  /** Початкова тема (опціонально) */
  initialTheme?: Theme;
  
  /** Дочірні компоненти */
  children: React.ReactNode;
}
```

## Додаткові типи компонентів

Крім основних типів, кожен компонент може мати власні типи для своїх пропсів:

```typescript
// src/components/common/ProgressBar.tsx
export interface ProgressBarProps {
  /** Значення прогресу (0-100) */
  progress: number;
  
  /** Додаткові CSS класи */
  className?: string;
  
  /** Колір прогрес-бару (опціонально) */
  color?: string;
  
  /** Анімувати прогрес */
  animate?: boolean;
}

// src/components/common/AnimatedValue.tsx
export interface AnimatedValueProps {
  /** Значення для відображення */
  value: string | number;
  
  /** Додаткові CSS класи */
  className?: string;
  
  /** Тривалість анімації в мс */
  duration?: number;
}

// src/components/common/NotificationPrompt.tsx
export interface NotificationPromptProps {
  /** Функція для запиту дозволу */
  onRequestPermission: () => void;
  
  /** Поточний стан дозволу */
  permissionState: NotificationPermission;
  
  /** Закрити вікно */
  onClose: () => void;
}
```

## Утилітарні типи

Проект також використовує утилітарні типи для полегшення роботи з існуючими типами:

```typescript
// src/types/utils.ts

/**
 * Робить всі властивості типу необов'язковими та nullable
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Робить всі властивості типу тільки для читання
 */
export type ReadOnly<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * Вибирає підмножину властивостей з типу
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Виключає підмножину властивостей з типу
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Перетворює перерахування на тип об'єднання
 */
export type ValueOf<T> = T[keyof T];
```

## Імпорт та використання типів

Приклади імпорту та використання типів у коді:

```typescript
// Імпорт типів у компонентах
import type { DonationCardProps } from '../types/donation';

export function DonationCard({
  collected,
  target,
  jarUrl,
  progress,
  className = ''
}: DonationCardProps) {
  // Реалізація компонента
}

// Імпорт типів у хуках
import type { UseDonationDataResult, DonationData } from '../types/donation';

export function useDonationData(jarUrl: string): UseDonationDataResult {
  // Реалізація хука
}

// Імпорт типів для API
import type { DonationData } from '../types/donation';

export async function fetchDonationData(jarUrl: string): Promise<DonationData> {
  // Реалізація API запиту
}
```

## Дженерики

Приклади використання дженериків:

```typescript
/**
 * Тип для типізації відповіді API
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  timestamp: string;
}

/**
 * Хук для отримання даних з API
 */
export function useApi<T>(url: string): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  // Реалізація хука
}

// Використання
const { data, loading, error } = useApi<DonationData>('/api/donation');
```

## Типи для контексту React

```typescript
// src/contexts/ThemeContext.tsx
import { createContext, useContext } from 'react';
import type { UseThemeResult } from '../types/theme';

export const ThemeContext = createContext<UseThemeResult | undefined>(undefined);

export function useThemeContext(): UseThemeResult {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
```

## Найкращі практики типізації

### 1. Використання строгої типізації

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    // ...
  }
}
```

### 2. Типізація пропсів компонентів

```typescript
// Краще
interface ButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

// Гірше
interface ButtonProps {
  [key: string]: any;
}
```

### 3. Документація типів за допомогою JSDoc

```typescript
/**
 * Представляє дані про збір коштів
 * @property {string} title - Назва збору
 * @property {string} collected - Зібрана сума у форматованому вигляді
 * @property {number} rawCollected - Зібрана сума в числовому форматі
 */
export interface DonationData {
  title: string;
  collected: string;
  rawCollected: number;
  // ...
}
```

### 4. Уникнення `any`

```typescript
// Краще
function parseData(data: unknown): DonationData {
  if (isValidDonationData(data)) {
    return data;
  }
  throw new Error('Invalid donation data');
}

// Гірше
function parseData(data: any): DonationData {
  return data;
}
```

### 5. Використання типів замість інтерфейсів для об'єднань

```typescript
// Краще
type Theme = 'light' | 'dark';

// Гірше
interface ThemeOptions {
  theme: 'light' | 'dark';
}
```

### 6. Імпорт типів з модифікатором type

```typescript
// Краще - імпортується тільки тип, без включення в JavaScript бандл
import type { DonationData } from '../types/donation';

// Гірше - імпортує як тип, так і значення, якщо воно є
import { DonationData } from '../types/donation';
```

## Перевірка типів

Для перевірки типів у рантаймі можна використовувати функції типу гарда:

```typescript
// src/utils/typeGuards.ts

/**
 * Перевіряє, чи є об'єкт валідними даними про збір
 */
export function isValidDonationData(data: unknown): data is DonationData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  
  return (
    typeof d.title === 'string' &&
    typeof d.collected === 'string' &&
    typeof d.target === 'string' &&
    typeof d.rawCollected === 'number' &&
    typeof d.rawTarget === 'number' &&
    typeof d.percentage === 'number'
  );
}

/**
 * Перевіряє, чи є значення валідною темою
 */
export function isValidTheme(theme: unknown): theme is Theme {
  return theme === 'light' || theme === 'dark';
}
```

## Додаткові ресурси

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript з React](https://react-typescript-cheatsheet.netlify.app/)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) 