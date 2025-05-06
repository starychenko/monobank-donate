// Service Worker для обробки push-сповіщень

// Подія встановлення сервіс-воркера
self.addEventListener('install', (event) => {
  console.log('Service Worker встановлений');
  self.skipWaiting();
});

// Подія активації сервіс-воркера
self.addEventListener('activate', (event) => {
  console.log('Service Worker активований');
  return self.clients.claim();
});

// Обробка push-сповіщень
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.message || 'Оновлення збору',
      icon: '/mono-icon.svg',
      badge: '/mono-icon.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || self.registration.scope
      },
      actions: [
        {
          action: 'open',
          title: 'Переглянути'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'MonobankDonate', options)
    );
  } catch (error) {
    console.error('Помилка при обробці push-сповіщення:', error);
  }
});

// Обробка кліків по сповіщеннях
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Якщо вікно додатку вже відкрите - фокусуємося на ньому
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Інакше - відкриваємо нове вікно
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
}); 