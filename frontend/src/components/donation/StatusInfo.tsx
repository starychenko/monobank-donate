import { useCountdown } from '../../hooks/useCountdown';
import { useEffect } from 'react';

interface StatusInfoProps {
  loading: boolean;
  error: string | null;
  updateInterval: number;
  lastUpdated?: Date;
  onCountdownComplete?: () => void;
}

/**
 * Компонент StatusInfo - відображає статус оновлення даних та зворотний відлік до наступного оновлення
 */
export function StatusInfo({ 
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
    <div className="card status-info-card">
      <div className="status-info-container">
        <div className="status-info-status">
          {loading ? (
            <>
              <div className="status-info-loading"></div>
              <span>Оновлення даних...</span>
            </>
          ) : error ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-error" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-error font-medium">{error}</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>
                Наступне оновлення через: <strong className="font-semibold text-primary">{seconds}</strong> с
              </span>
            </>
          )}
        </div>
        
        {lastUpdated && (
          <div className="status-info-time">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Останнє оновлення: {formatTime(lastUpdated)}</span>
          </div>
        )}
      </div>
    </div>
  );
} 