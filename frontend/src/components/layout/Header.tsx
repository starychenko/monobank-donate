import { Theme } from '../../types/theme';
import { useEffect, useState } from 'react';
import { getNotificationPermission, isNotificationsSupported, requestNotificationPermission } from '../../utils/notifications';

// Інтервал перевірки дозволу сповіщень у мілісекундах
const PERMISSION_CHECK_INTERVAL = Number(import.meta.env.VITE_NOTIFICATION_PERMISSION_CHECK_INTERVAL || 2000);

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
}

/**
 * Компонент Header - відображає шапку сайту з логотипом та кнопкою перемикання теми
 */
export function Header({ theme, onToggleTheme }: HeaderProps) {
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | null>(null);
  
  // Перевіряємо статус сповіщень при завантаженні
  useEffect(() => {
    if (isNotificationsSupported()) {
      setNotificationStatus(getNotificationPermission());
      
      // Додаємо слухач на зміну дозволу сповіщень
      const handlePermissionChange = () => {
        setNotificationStatus(getNotificationPermission());
      };
      
      // Для Safari/Chrome можемо перевіряти періодично
      const checkPermissionInterval = setInterval(handlePermissionChange, PERMISSION_CHECK_INTERVAL);
      
      return () => {
        clearInterval(checkPermissionInterval);
      };
    }
  }, []);
  
  // Обробник кліку по кнопці сповіщень
  const handleNotificationToggle = async () => {
    if (notificationStatus === 'granted') {
      // Якщо дозвіл вже надано, показуємо інформацію про це
      alert('Сповіщення вже увімкнено');
    } else if (notificationStatus === 'denied') {
      // Якщо дозвіл заборонено, показуємо інструкцію
      alert('Сповіщення заблоковано. Змініть налаштування дозволу в налаштуваннях браузера.');
    } else {
      // Інакше запитуємо дозвіл
      const granted = await requestNotificationPermission();
      setNotificationStatus(granted ? 'granted' : 'denied');
    }
  };
  
  return (
    <header className="app-header">
      <div className="container header-container">
        <h1 className="app-title">
          <span className="app-title-mono">mono</span>
          <span className="app-title-bank">bank</span>
          <span className="app-title-donate">Donate</span>
        </h1>
          
        <div className="app-header-actions">
          {/* Кнопка сповіщень */}
          {isNotificationsSupported() && (
            <button 
              className="notification-toggle-button"
              onClick={handleNotificationToggle}
              aria-label="Керування сповіщеннями"
            >
              {notificationStatus === 'granted' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              ) : notificationStatus === 'denied' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
              )}
            </button>
          )}
          
          {/* Кнопка перемикання теми */}
          <button 
            className="theme-toggle-button"
            onClick={onToggleTheme}
            aria-label="Перемкнути тему"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
} 