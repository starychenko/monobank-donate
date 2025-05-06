import { useCountdown } from '../../hooks/useCountdown';
import { useEffect, memo } from 'react';

/**
 * Інтерфейс для властивостей компонента StatusInfo
 * 
 * @property {boolean} loading - Стан завантаження даних
 * @property {string|null} error - Текст помилки, якщо така сталася
 * @property {number} updateInterval - Інтервал оновлення даних в мілісекундах
 * @property {Date} [lastUpdated] - Час останнього успішного оновлення даних
 * @property {Function} [onCountdownComplete] - Функція, що викликається при завершенні відліку
 */
interface StatusInfoProps {
  loading: boolean;
  error: string | null;
  updateInterval: number;
  lastUpdated?: Date;
  onCountdownComplete?: () => void;
}

/**
 * Компонент StatusInfo - відображає статус оновлення даних та зворотний відлік
 * 
 * Відображає інформацію про стан завантаження даних, помилки (якщо є) та
 * зворотний відлік до наступного оновлення. В залежності від стану змінює
 * своє відображення і анімацію. Використовує хук useCountdown для керування
 * відліком часу. Компонент мемоізований для оптимізації продуктивності.
 * 
 * @param {StatusInfoProps} props - Властивості компонента
 * @param {boolean} props.loading - Стан завантаження даних
 * @param {string|null} props.error - Текст помилки, якщо така сталася
 * @param {number} props.updateInterval - Інтервал оновлення даних в мілісекундах
 * @param {Date} [props.lastUpdated] - Час останнього успішного оновлення даних
 * @param {Function} [props.onCountdownComplete] - Функція, що викликається при завершенні відліку
 * 
 * @example
 * // Базовий приклад
 * <StatusInfo
 *   loading={false}
 *   error={null}
 *   updateInterval={15000}
 *   lastUpdated={new Date()}
 *   onCountdownComplete={() => fetchData()}
 * />
 * 
 * @example
 * // Приклад з помилкою
 * <StatusInfo
 *   loading={false}
 *   error="Не вдалося підключитися до сервера"
 *   updateInterval={15000}
 * />
 */
const StatusInfo = memo(function StatusInfo({ 
  loading, 
  error, 
  updateInterval, 
  lastUpdated, 
  onCountdownComplete 
}: StatusInfoProps) {
  const { seconds, restart } = useCountdown(
    updateInterval,
    false,
    onCountdownComplete,
    false // Не перезапускаємо при зміні updateInterval
  );
  
  // Перезапуск таймера після завершення завантаження
  useEffect(() => {
    // Якщо завантаження завершилось і таймер не запущено
    if (!loading && lastUpdated) {
      restart();
    }
  }, [loading, lastUpdated, restart]);
  
  const formatTime = (date?: Date) => {
    if (!date) return 'Не відомо';
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div 
      className="card status-info-card"
      style={{
        transition: 'all 0.3s ease',
        transform: loading ? 'translateY(0)' : 'translateY(0)'
      }}
    >
      <div className="status-info-container">
        <div 
          className="status-info-status"
          style={{
            transition: 'opacity 0.3s ease'
          }}
        >
          {loading ? (
            <>
              <div 
                className="status-info-loading"
                style={{
                  animation: 'spin 1s linear infinite',
                  borderTopColor: 'var(--color-primary, #FFD100)'
                }}
              ></div>
              <span style={{ animation: 'fadeInOut 1.5s infinite' }}>Оновлення даних...</span>
            </>
          ) : error ? (
            <>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-6 h-6 text-error" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                style={{ animation: 'shake 0.5s ease-in-out' }}
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span 
                className="text-error font-medium"
                style={{ animation: 'shake 0.5s ease-in-out' }}
              >
                {error}
              </span>
            </>
          ) : (
            <>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-6 h-6 text-primary" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                style={{ transition: 'transform 0.3s ease' }}
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>
                Наступне оновлення через: <strong 
                  className="font-semibold text-primary"
                  style={{ 
                    transition: 'all 0.2s ease',
                    display: 'inline-block',
                    minWidth: '1.5rem',
                    textAlign: 'center'
                  }}
                >{seconds}</strong> с
              </span>
            </>
          )}
        </div>
        
        {lastUpdated && (
          <div 
            className="status-info-time"
            style={{
              transition: 'opacity 0.3s ease',
              animation: !loading && lastUpdated ? 'fadeIn 0.5s ease' : 'none'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Останнє оновлення: {formatTime(lastUpdated)}</span>
          </div>
        )}
      </div>
    </div>
  );
});

// Додаємо CSS анімації
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
      20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
  `;
  document.head.appendChild(style);
}

export { StatusInfo }; 