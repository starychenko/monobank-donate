import { useState, useEffect } from 'react';
import { 
  isNotificationsSupported, 
  getNotificationPermission, 
  requestNotificationPermission,
  registerServiceWorker
} from '../../utils/notifications';

/**
 * Інтерфейс для властивостей компонента NotificationPrompt
 */
interface NotificationPromptProps {
  className?: string;
}

/**
 * Компонент для запиту дозволу на відображення сповіщень
 */
export const NotificationPrompt = ({ className = '' }: NotificationPromptProps) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  
  // Перевіряємо підтримку сповіщень при монтуванні компонента
  useEffect(() => {
    const supported = isNotificationsSupported();
    setIsSupported(supported);
    
    if (supported) {
      const currentPermission = getNotificationPermission();
      
      // Показуємо запит лише якщо дозвіл ще не надано
      setShowPrompt(currentPermission === 'default');
      
      // Якщо дозвіл вже надано, реєструємо сервіс-воркер
      if (currentPermission === 'granted') {
        registerServiceWorker();
      }
    }
  }, []);
  
  // Функція запиту дозволу
  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    
    // Сховати запит після отримання відповіді
    setShowPrompt(false);
    
    // Якщо отримано дозвіл, реєструємо сервіс-воркер
    if (granted) {
      await registerServiceWorker();
    }
  };
  
  // Функція закриття запиту
  const dismissPrompt = () => {
    setShowPrompt(false);
  };
  
  // Якщо сповіщення не підтримуються або дозвіл вже вирішено, не показуємо запит
  if (!isSupported || !showPrompt) {
    return null;
  }
  
  // Виводимо запит на дозвіл сповіщень
  return (
    <div className={`notification-prompt ${className}`}>
      <div className="notification-prompt-content">
        <div className="notification-prompt-message">
          Отримуйте сповіщення про значні зміни у зборі
        </div>
        <div className="notification-prompt-actions">
          <button
            className="notification-prompt-button notification-prompt-allow"
            onClick={requestPermission}
          >
            Дозволити
          </button>
          <button
            className="notification-prompt-button notification-prompt-dismiss"
            onClick={dismissPrompt}
          >
            Пізніше
          </button>
        </div>
      </div>
    </div>
  );
}; 