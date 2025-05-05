import { useState, useEffect } from 'react';

interface StatusInfoProps {
  loading: boolean;
  error: string | null;
  updateInterval: number;
  lastUpdated?: Date;
  onCountdownComplete?: () => void;
}

export function StatusInfo({ loading, error, updateInterval, lastUpdated, onCountdownComplete }: StatusInfoProps) {
  const [countdown, setCountdown] = useState<number>(updateInterval / 1000);
  
  // Запускаємо зворотній відлік
  useEffect(() => {
    if (loading) return; // Не рахуємо під час завантаження
    
    setCountdown(updateInterval / 1000);
    
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, updateInterval, lastUpdated]);
  
  // Окремий ефект для виклику onCountdownComplete
  useEffect(() => {
    if (countdown === 0 && onCountdownComplete && !loading) {
      onCountdownComplete();
    }
  }, [countdown, onCountdownComplete, loading]);
  
  const formatTime = (date?: Date) => {
    if (!date) return 'Не відомо';
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="card" style={{ 
      padding: '1.25rem', 
      textAlign: 'center',
      minHeight: '6.5rem', // Стабілізуємо розмір блоку
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: 'rgba(255,255,255,0.8)',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-normal)'
        }}>
          {loading ? (
            <>
              <div className="spinner" style={{ 
                width: '1.25rem', 
                height: '1.25rem', 
                borderRadius: '9999px',
                border: '2px solid rgba(0,0,0,0.1)',
                borderTopColor: 'var(--primary-color)'
              }}></div>
              <span>Оновлення даних...</span>
            </>
          ) : error ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 20 20" fill="#e53e3e">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span style={{ color: '#e53e3e', fontWeight: 'var(--font-weight-medium)' }}>{error}</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary-color)' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>
                Наступне оновлення через: <strong style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary-color)' }}>{countdown}</strong> с
              </span>
            </>
          )}
        </div>
        
        {lastUpdated && (
          <div style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            gap: '0.35rem',
            alignItems: 'center',
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-weight-normal)'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '0.75rem', height: '0.75rem' }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Останнє оновлення: {formatTime(lastUpdated)}</span>
          </div>
        )}
      </div>
    </div>
  );
} 