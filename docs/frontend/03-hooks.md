# Хуки

## Огляд

Хуки є ключовою частиною фронтенду Monobank Donate, оскільки інкапсулюють більшу частину бізнес-логіки і управління станом додатку. У проекті використовуються такі кастомні хуки:

```
src/hooks/
├─ useCountdown.ts        # Хук для зворотного відліку
├─ useDonationData.ts     # Хук для отримання даних про збір
└─ useTheme.ts            # Хук для керування темою
```

## useDonationData

Цей хук є центральною частиною додатку, відповідальною за отримання та управління даними про збір коштів Monobank.

### Призначення

Хук `useDonationData` виконує такі функції:
- Завантаження даних про збір з бекенду
- Керування станом завантаження та помилками
- Відстеження часу останнього оновлення
- Планування періодичних оновлень
- Надання методу для ручного оновлення даних

### Інтерфейс

```typescript
function useDonationData(jarUrl: string) {
  return {
    data: FundData;          // Дані про збір
    loading: boolean;        // Стан завантаження
    error: string | null;    // Помилка, якщо є
    lastUpdated: Date | undefined;  // Час останнього оновлення
    triggerUpdate: () => void;      // Функція для ручного оновлення
  };
}
```

Де `FundData` - це інтерфейс для даних про збір:

```typescript
interface FundData {
  title: string;            // Назва збору
  collected: string;        // Зібрана сума
  target: string;           // Цільова сума
  description?: string;     // Опис збору (опціонально)
}
```

### Реалізація

```typescript
export function useDonationData(jarUrl: string) {
  const [data, setData] = useState<FundData>({ 
    title: '', 
    collected: '', 
    target: '',
    description: 'Опис збору...'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Ref для відстеження початкового завантаження
  const initialFetchDone = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDonationData(jarUrl);
      setData(prev => ({...result, description: prev.description}));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося отримати дані');
      console.error('Помилка запиту:', err);
    } finally {
      setLoading(false);
      setShouldFetch(false);
    }
  }, [jarUrl]);

  // Початкове завантаження при монтуванні компонента
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchData();
      initialFetchDone.current = true;
    }
  }, [fetchData]);

  // Обробка наступних оновлень при зміні shouldFetch
  useEffect(() => {
    if (shouldFetch && initialFetchDone.current) {
      fetchData();
    }
  }, [shouldFetch, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    triggerUpdate: () => setShouldFetch(true)
  };
}
```

### Приклад використання

```tsx
function DonationStatus() {
  const { data, loading, error, lastUpdated, triggerUpdate } = useDonationData(
    'https://send.monobank.ua/jar/123456789'
  );

  if (loading) return <div>Завантаження...</div>;
  if (error) return <div>Помилка: {error}</div>;

  return (
    <div>
      <h2>{data.title}</h2>
      <p>Зібрано: {data.collected}</p>
      <p>Ціль: {data.target}</p>
      <p>Останнє оновлення: {lastUpdated?.toLocaleTimeString()}</p>
      <button onClick={triggerUpdate}>Оновити</button>
    </div>
  );
}
```

## useCountdown

Хук для управління зворотним відліком, який використовується для показу часу до наступного оновлення даних.

### Призначення

Хук `useCountdown` виконує такі функції:
- Створення зворотного відліку від заданого часу
- Оновлення відліку кожну секунду
- Виклик callback-функції при досягненні нуля
- Форматування часу для відображення

### Інтерфейс

```typescript
function useCountdown(
  duration: number,
  onComplete?: () => void,
  autoStart: boolean = true
) {
  return {
    timeLeft: number;           // Залишилось часу (мс)
    formattedTime: string;      // Відформатований час (хв:сек)
    isRunning: boolean;         // Чи йде відлік
    progress: number;           // Прогрес (0-100%)
    start: () => void;          // Почати/перезапустити відлік
    pause: () => void;          // Призупинити відлік
    reset: () => void;          // Скинути відлік до початкового значення
  };
}
```

### Реалізація

```typescript
export function useCountdown(
  duration: number,
  onComplete?: () => void,
  autoStart: boolean = true
) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  const start = useCallback(() => {
    clearTimer();
    startTimeRef.current = Date.now() - pausedTimeRef.current;
    setIsRunning(true);
    
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = duration - elapsed;
      
      if (remaining <= 0) {
        clearTimer();
        setTimeLeft(0);
        setIsRunning(false);
        if (onComplete) {
          onComplete();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000) as unknown as number;
  }, [duration, onComplete]);
  
  const pause = useCallback(() => {
    if (isRunning) {
      clearTimer();
      pausedTimeRef.current = Date.now() - startTimeRef.current;
      setIsRunning(false);
    }
  }, [isRunning]);
  
  const reset = useCallback(() => {
    clearTimer();
    setTimeLeft(duration);
    pausedTimeRef.current = 0;
    setIsRunning(false);
  }, [duration]);
  
  useEffect(() => {
    if (autoStart) {
      start();
    }
    
    return () => clearTimer();
  }, [autoStart, start]);
  
  // Форматування часу у вигляді хв:сек
  const formattedTime = useMemo(() => {
    const totalSeconds = Math.ceil(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);
  
  // Розрахунок прогресу відліку (0-100%)
  const progress = useMemo(() => {
    return ((duration - timeLeft) / duration) * 100;
  }, [duration, timeLeft]);
  
  return {
    timeLeft,
    formattedTime,
    isRunning,
    progress,
    start,
    pause,
    reset
  };
}
```

### Приклад використання

```tsx
function UpdateCountdown() {
  const { formattedTime, progress } = useCountdown(
    15000, // 15 секунд
    () => console.log('Відлік завершено!'),
    true // автоматичний старт
  );

  return (
    <div>
      <p>Наступне оновлення через: {formattedTime}</p>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}
```

## useTheme

Хук для керування темою додатку (світла/темна).

### Призначення

Хук `useTheme` виконує такі функції:
- Управління поточною темою (світла/темна)
- Збереження вибраної теми в localStorage
- Автоматичне визначення теми системи
- Переключення між темами

### Інтерфейс

```typescript
function useTheme() {
  return {
    theme: 'light' | 'dark';   // Поточна тема
    toggleTheme: () => void;   // Функція для переключення теми
  };
}
```

### Реалізація

```typescript
export function useTheme() {
  // Перевірка збереженої теми або системних налаштувань
  const getInitialTheme = (): 'light' | 'dark' => {
    // Перевірка localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Перевірка системних налаштувань
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // За замовчуванням світла тема
    return 'light';
  };
  
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  
  // Переключення теми
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // Збереження в localStorage
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);
  
  // Встановлення CSS-класу на документі
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);
  
  // Слідкування за змінами системних налаштувань
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Змінюємо тему тільки якщо користувач не вибрав її вручну
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return { theme, toggleTheme };
}
```

### Приклад використання

```tsx
function ThemeToggler() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle-btn"
      aria-label={`Переключити на ${theme === 'light' ? 'темну' : 'світлу'} тему`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

## Комбінування хуків

Хуки можуть бути комбіновані для створення складної функціональності:

```tsx
function DonationUpdater() {
  const { data, loading, error, lastUpdated, triggerUpdate } = useDonationData(
    'https://send.monobank.ua/jar/123456789'
  );
  
  const { formattedTime } = useCountdown(
    15000, // 15 секунд
    triggerUpdate, // Автоматичне оновлення після закінчення відліку
    true
  );
  
  const { theme } = useTheme();
  
  return (
    <div className={`donation-updater ${theme}`}>
      <h2>Дані про збір</h2>
      {loading ? (
        <p>Завантаження...</p>
      ) : error ? (
        <p className="error">Помилка: {error}</p>
      ) : (
        <>
          <p>Зібрано: {data.collected}</p>
          <p>Ціль: {data.target}</p>
          <p>Останнє оновлення: {lastUpdated?.toLocaleTimeString()}</p>
          <p>Наступне оновлення через: {formattedTime}</p>
        </>
      )}
    </div>
  );
}
```

## Практичні рекомендації роботи з хуками

1. **Інкапсуляція логіки** - винесення специфічної логіки в окремі хуки
2. **Чисті функції** - хуки повинні бути передбачуваними і не мати побічних ефектів
3. **Мемоізація callback-функцій** - використання `useCallback` для оптимізації
4. **Мемоізація обчислюваних значень** - використання `useMemo` для оптимізації
5. **Типізація** - використання TypeScript для чіткого визначення типів вхідних і вихідних даних
6. **Правила хуків** - дотримання правил React щодо виклику хуків тільки на верхньому рівні
7. **Розділення відповідальності** - кожен хук повинен відповідати за одну функцію
8. **Повторне використання** - проектування хуків для можливості повторного використання 