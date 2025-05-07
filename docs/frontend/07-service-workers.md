# Service Workers та сповіщення

## Загальний огляд

Проект Monobank Donate використовує Service Workers для надання користувачам push-сповіщень про зміни в стані збору коштів. Це дозволяє інформувати користувачів про нові надходження коштів навіть коли вони не мають відкритої вкладки з додатком.

## Структура файлів

```
frontend/
├─ public/
│  └─ sw.js               # Service Worker файл
├─ src/
│  ├─ components/
│  │  └─ common/
│  │     └─ NotificationPrompt.tsx  # Компонент запиту дозволу на сповіщення
│  └─ utils/
│     └─ notifications.ts  # Утиліти для роботи зі сповіщеннями
```

## Реєстрація Service Worker

Service Worker реєструється в додатку під час його ініціалізації:

```typescript
// src/main.tsx або App.tsx
import { registerServiceWorker } from './utils/notifications';

// Реєстрація Service Worker при запуску додатку
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}
```

Функція реєстрації Service Worker:

```typescript
// src/utils/notifications.ts
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker зареєстровано з областю дії:', registration.scope);
      return registration;
    }
    console.warn('Service Workers не підтримуються у цьому браузері');
    return null;
  } catch (error) {
    console.error('Помилка реєстрації Service Worker:', error);
    return null;
  }
}
```

## Реалізація Service Worker

Файл `public/sw.js` містить реалізацію Service Worker:

```javascript
// public/sw.js
const CACHE_NAME = 'monobank-donate-v1';
const OFFLINE_URL = '/offline.html';

// Встановлення Service Worker і кешування основних ресурсів
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/offline.html',
          '/mono-icon.svg',
          '/main.js',
          '/styles.css'
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

// Активація Service Worker і видалення старих кешів
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обробка fetch-запитів, спроба використання кешу перед мережевим запитом
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});

// Обробка push-сповіщень
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/mono-icon.svg',
    badge: '/mono-icon.svg',
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Переглянути'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Обробка кліків по сповіщенню
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Якщо є відкриті вікна додатку, переходимо на них
          for (const client of clientList) {
            if (client.url && 'focus' in client) {
              client.focus();
              return;
            }
          }
          // Якщо немає відкритих вікон, відкриваємо нове
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url);
          }
        })
    );
  }
});
```

## Запит дозволу на сповіщення

Компонент `NotificationPrompt` використовується для запиту в користувача дозволу на показ сповіщень:

```tsx
// src/components/common/NotificationPrompt.tsx
import React, { useState, useEffect } from 'react';
import { requestNotificationPermission } from '../../utils/notifications';

interface NotificationPromptProps {
  onRequestPermission: () => void;
  permissionState: NotificationPermission;
  onClose: () => void;
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({
  onRequestPermission,
  permissionState,
  onClose
}) => {
  const [visible, setVisible] = useState(permissionState === 'default');

  useEffect(() => {
    setVisible(permissionState === 'default');
  }, [permissionState]);
  
  const handleRequestPermission = async () => {
    await onRequestPermission();
    setVisible(false);
  };

  const handleDecline = () => {
    setVisible(false);
    onClose();
  };
  
  if (!visible) return null;
  
  return (
    <div className="notification-prompt fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm">
      <h3 className="text-lg font-bold mb-2">Сповіщення про збір</h3>
      <p className="mb-4">
        Отримуйте сповіщення про значні зміни в сумі збору, щоб бути в курсі важливих оновлень.
      </p>
      <div className="flex gap-2">
        <button 
          onClick={handleRequestPermission}
          className="btn btn-primary"
        >
          Дозволити
        </button>
        <button 
          onClick={handleDecline}
          className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
        >
          Пізніше
        </button>
      </div>
    </div>
  );
};
```

## Утиліти для сповіщень

Файл `utils/notifications.ts` містить функції для роботи зі сповіщеннями:

```typescript
// src/utils/notifications.ts
import { NOTIFICATION_THRESHOLD } from '../constants/api';
import type { DonationChangeNotification } from '../types/donation';

/**
 * Запитує дозвіл на показ сповіщень
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Цей браузер не підтримує сповіщення');
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
}

/**
 * Перевіряє, чи слід показувати сповіщення про зміну суми збору
 */
export function shouldShowDonationNotification(
  previousAmount: number, 
  currentAmount: number
): boolean {
  // Перевіряємо, чи сума збору збільшилась
  if (currentAmount <= previousAmount) {
    return false;
  }
  
  // Перевіряємо, чи різниця перевищує поріг для сповіщення
  const difference = currentAmount - previousAmount;
  return difference >= NOTIFICATION_THRESHOLD;
}

/**
 * Показує сповіщення про зміну суми збору
 */
export function showDonationUpdateNotification(notification: DonationChangeNotification): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  const { previousAmount, currentAmount, difference } = notification;
  
  const formattedDifference = new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(difference);
  
  const title = 'Оновлення суми збору';
  const body = `Сума збору збільшилась на ${formattedDifference}!`;
  
  // Показ сповіщення через Service Worker (якщо він зареєстрований)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body,
        icon: '/mono-icon.svg',
        badge: '/mono-icon.svg',
        data: {
          url: window.location.origin,
          timestamp: new Date().toISOString()
        },
        actions: [
          {
            action: 'open',
            title: 'Переглянути'
          }
        ]
      });
    });
  } else {
    // Fallback для браузерів без підтримки Service Worker
    new Notification(title, { body });
  }
}

/**
 * Реєструє Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker зареєстровано:', registration.scope);
      return registration;
    }
    console.warn('Service Workers не підтримуються у цьому браузері');
    return null;
  } catch (error) {
    console.error('Помилка реєстрації Service Worker:', error);
    return null;
  }
}
```

## Інтеграція сповіщень в додаток

Сповіщення інтегруються в головний компонент App:

```typescript
// src/components/App.tsx
import { useState, useEffect, useRef } from 'react';
import { useDonationData } from '../hooks/useDonationData';
import { useTheme } from '../hooks/useTheme';
import { 
  requestNotificationPermission, 
  shouldShowDonationNotification, 
  showDonationUpdateNotification,
  registerServiceWorker
} from '../utils/notifications';
import { DonationCard } from './donation/DonationCard';
import { StatusInfo } from './donation/StatusInfo';
import { NotificationPrompt } from './common/NotificationPrompt';
import { Header } from './layout/Header';
import { UPDATE_INTERVAL } from '../constants/api';

export function App() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const { theme, toggleTheme } = useTheme();
  const { data, loading, error, lastUpdated, triggerUpdate } = useDonationData(
    import.meta.env.VITE_DEFAULT_JAR_URL
  );
  
  // Використовуємо ref для зберігання попереднього значення суми збору
  const prevCollectedRef = useRef<number>(0);
  
  // Реєстрація Service Worker при монтуванні компонента
  useEffect(() => {
    registerServiceWorker();
  }, []);
  
  // Обробка змін у сумі збору для показу сповіщень
  useEffect(() => {
    if (!data || loading || error) return;
    
    const currentAmount = data.rawCollected;
    const previousAmount = prevCollectedRef.current;
    
    // Якщо це не перше завантаження і дозвіл на сповіщення наданий
    if (previousAmount > 0 && notificationPermission === 'granted') {
      if (shouldShowDonationNotification(previousAmount, currentAmount)) {
        showDonationUpdateNotification({
          previousAmount,
          currentAmount,
          difference: currentAmount - previousAmount,
          timestamp: new Date()
        });
      }
    }
    
    // Оновлюємо збережене значення
    prevCollectedRef.current = currentAmount;
  }, [data, loading, error, notificationPermission]);
  
  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };
  
  return (
    <div className={`app-container min-h-screen ${theme}`}>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      
      <main className="container mx-auto px-4 py-8">
        <DonationCard 
          collected={data?.collected}
          target={data?.target}
          jarUrl={import.meta.env.VITE_DEFAULT_JAR_URL}
          progress={data?.percentage || 0}
        />
        
        <StatusInfo 
          loading={loading}
          error={error}
          lastUpdated={lastUpdated}
          updateInterval={UPDATE_INTERVAL}
          onCountdownComplete={triggerUpdate}
        />
        
        {/* Промпт для запиту дозволу на сповіщення */}
        <NotificationPrompt
          permissionState={notificationPermission}
          onRequestPermission={handleRequestPermission}
          onClose={() => {}}
        />
      </main>
    </div>
  );
}
```

## Offline Fallback

Файл `public/offline.html` надає базову сторінку, коли користувач перебуває офлайн:

```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monobank Donate - Офлайн</title>
  <style>
    body {
      font-family: 'Inter', Arial, sans-serif;
      line-height: 1.6;
      color: #1b1c21;
      background-color: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 0 1rem;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 2rem;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #1b1c21;
      margin-top: 0;
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .message {
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      background-color: #ffd166;
      color: #1b1c21;
      font-weight: 600;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      text-decoration: none;
      transition: background-color 0.2s;
    }
    .btn:hover {
      background-color: #ffc233;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📶</div>
    <h1>Ви офлайн</h1>
    <p class="message">
      Немає з'єднання з інтернетом. Перевірте підключення та спробуйте оновити сторінку.
    </p>
    <a href="/" class="btn">Спробувати знову</a>
  </div>
</body>
</html>
```

## Перевірка стану сповіщень

Функція для перевірки поточного стану дозволу на сповіщення:

```typescript
/**
 * Перевіряє поточний стан дозволу на сповіщення
 */
export function checkNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  return Notification.permission;
}
```

## Рекомендації щодо роботи зі сповіщеннями

1. **Поважайте вибір користувача** - не просіть дозвіл на сповіщення одразу при завантаженні сторінки, дайте користувачу зрозуміти цінність сповіщень.

2. **Показуйте важливі сповіщення** - надсилайте сповіщення тільки для суттєвих змін, щоб не втомлювати користувача.

3. **Надавайте опцію відмови** - дозвольте користувачам легко відключити сповіщення через інтерфейс додатку.

4. **Тестуйте на різних пристроях** - сповіщення можуть виглядати і поводитись по-різному на різних платформах.

5. **Враховуйте обмеження браузерів** - не всі браузери підтримують повний функціонал сповіщень.

## Обмеження та проблеми

1. **Safari** має обмежену підтримку Push API, особливо на iOS.
2. **Firefox** вимагає, щоб сайт працював через HTTPS для використання сповіщень.
3. **Мобільні браузери** по-різному взаємодіють зі сповіщеннями залежно від ОС.
4. **Quantum Page Reload** в Chrome інколи повторно реєструє Service Worker.

## Пересилання сповіщень від бекенду

Для повноцінної системи сповіщень можна додати взаємодію з бекендом:

```typescript
/**
 * Підписує пристрій користувача на сповіщення від бекенду
 */
export async function subscribeToServerNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push сповіщення не підтримуються в цьому браузері');
      return false;
    }
    
    const registration = await navigator.serviceWorker.ready;
    
    // Отримання існуючої підписки або створення нової
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Отримання VAPID публічного ключа від сервера
      const response = await fetch('/api/push/vapid-key');
      const vapidPublicKey = await response.text();
      
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Створення нової підписки
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }
    
    // Відправка інформації про підписку на сервер
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });
    
    return true;
  } catch (error) {
    console.error('Помилка підписки на сповіщення:', error);
    return false;
  }
}

/**
 * Конвертує закодований Base64 URL-safe ключ у масив Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
```

## Приклади використання

### Ручне тестування сповіщень

```typescript
/**
 * Функція для ручного тестування сповіщень
 */
export function testNotification(): void {
  if (Notification.permission !== 'granted') {
    console.warn('Немає дозволу на показ сповіщень');
    return;
  }
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification('Тестове сповіщення', {
        body: 'Це тестове сповіщення для перевірки функціональності',
        icon: '/mono-icon.svg',
        badge: '/mono-icon.svg'
      });
    });
  } else {
    new Notification('Тестове сповіщення', {
      body: 'Це тестове сповіщення для перевірки функціональності'
    });
  }
}
```

### Контроль дозволів через кнопку налаштувань

```tsx
function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  
  const handleToggle = async () => {
    if (permission === 'granted') {
      // Показуємо інструкцію, як відключити сповіщення в браузері
      alert('Щоб відключити сповіщення, використовуйте налаштування вашого браузера');
    } else {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
    }
  };
  
  return (
    <div className="notification-settings">
      <h3>Сповіщення</h3>
      <p>Поточний статус: {
        permission === 'granted' ? 'Дозволено' : 
        permission === 'denied' ? 'Заблоковано' : 'Не визначено'
      }</p>
      
      <button 
        onClick={handleToggle}
        className="btn btn-primary"
        disabled={permission === 'denied'}
      >
        {permission === 'granted' ? 'Відключити' : 'Включити'} сповіщення
      </button>
      
      {permission === 'denied' && (
        <p className="text-sm text-red-500">
          Сповіщення заблоковано браузером. Для активації змініть дозволи сайту в налаштуваннях браузера.
        </p>
      )}
    </div>
  );
}
``` 