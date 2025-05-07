/**
 * Утиліти для роботи з push-сповіщеннями
 */

// Розширюємо інтерфейс NotificationOptions для підтримки вібрації
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
}

// Порогові значення для сповіщень (з .env або значення за замовчуванням)
const NOTIFICATION_THRESHOLD_TARGET_PERCENT = Number(import.meta.env.VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT || 2);
const NOTIFICATION_THRESHOLD_CURRENT_PERCENT = Number(import.meta.env.VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT || 5);
const NOTIFICATION_THRESHOLD_ABSOLUTE = Number(import.meta.env.VITE_NOTIFICATION_THRESHOLD_ABSOLUTE || 1000);

/**
 * Перевіряє, чи підтримуються сповіщення в поточному браузері
 */
export const isNotificationsSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Перевіряє, чи надав користувач дозвіл на сповіщення
 */
export const getNotificationPermission = (): NotificationPermission | null => {
  if (!isNotificationsSupported()) {
    return null;
  }
  return Notification.permission;
};

/**
 * Запитує дозвіл на відображення сповіщень
 * @returns Promise<boolean> - чи надав користувач дозвіл
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationsSupported()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Помилка запиту дозволу на сповіщення:', error);
    return false;
  }
};

/**
 * Реєструє сервіс-воркер для обробки push-сповіщень
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isNotificationsSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    console.error('Помилка реєстрації сервіс-воркера:', error);
    return null;
  }
};

/**
 * Відображає локальне сповіщення
 * @param title - заголовок сповіщення
 * @param options - опції сповіщення
 */
export const showLocalNotification = (
  title: string, 
  options: ExtendedNotificationOptions = {}
): Notification | null => {
  if (!isNotificationsSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const defaultOptions: ExtendedNotificationOptions = {
      body: 'Оновлення збору',
      icon: '/mono-icon.svg',
      badge: '/mono-icon.svg',
      vibrate: [100, 50, 100],
      requireInteraction: true
    };

    return new Notification(title, { ...defaultOptions, ...options } as NotificationOptions);
  } catch (error) {
    console.error('Помилка відображення сповіщення:', error);
    return null;
  }
};

/**
 * Показує сповіщення про значні зміни у зборі
 * @param currentAmount - поточна сума збору
 * @param previousAmount - попередня сума збору
 * @param targetAmount - цільова сума збору
 * @returns Promise<boolean> - чи було показано сповіщення
 */
export const notifyDonationChange = async (
  currentAmount: number,
  previousAmount: number,
  targetAmount: number
): Promise<boolean> => {
  // Не показуємо сповіщення, якщо вони не підтримуються або не дозволені
  if (!isNotificationsSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const difference = currentAmount - previousAmount;
    if (difference <= 0) return false;

    // Визначаємо, чи є зміни значними
    const percentOfTarget = (difference / targetAmount) * 100;
    const percentOfCurrent = (difference / previousAmount) * 100;
    const isSignificant = 
      percentOfTarget >= NOTIFICATION_THRESHOLD_TARGET_PERCENT || 
      percentOfCurrent >= NOTIFICATION_THRESHOLD_CURRENT_PERCENT || 
      difference >= NOTIFICATION_THRESHOLD_ABSOLUTE;

    if (!isSignificant) return false;

    // Форматуємо суми для відображення
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: 'UAH',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const diffFormatted = formatCurrency(difference);
    const currentFormatted = formatCurrency(currentAmount);
    const targetFormatted = formatCurrency(targetAmount);
    const percentOfTargetTotal = Math.round((currentAmount / targetAmount) * 100);

    let title = 'Значне поповнення збору!';
    let message = `Отримано ${diffFormatted}! Вже зібрано ${currentFormatted} (${percentOfTargetTotal}% від цілі).`;

    // Додаткова інформація, якщо ціль майже досягнута
    if (percentOfTargetTotal >= 90 && percentOfTargetTotal < 100) {
      message += ` Майже досягли мети в ${targetFormatted}!`;
    } else if (percentOfTargetTotal >= 100) {
      title = 'Ціль досягнута!';
      message = `Збір успішно завершено! Зібрано ${currentFormatted}.`;
    }

    showLocalNotification(title, { body: message });
    return true;
  } catch (error) {
    console.error('Помилка при створенні сповіщення про зміну суми збору:', error);
    return false;
  }
}; 