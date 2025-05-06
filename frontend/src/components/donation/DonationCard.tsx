import { memo } from 'react';
import QRCode from 'react-qr-code';
import { ProgressBar } from '../common/ProgressBar';

interface DonationCardProps {
  collected: string | null;
  target: string | null;
  jarUrl: string;
  progress: number;
}

/**
 * Компонент DonationCard - відображає QR-код для пожертвування та статистику збору
 * Мемоізований для оптимізації продуктивності
 */
const DonationCard = memo(function DonationCard({ 
  collected, 
  target, 
  jarUrl, 
  progress 
}: DonationCardProps) {
  return (
    <div className="card donation-card">
      {/* Заголовок */}
      <div className="donation-card-header">
        <h2 className="donation-card-title not-italic">
          Скануй QR-код
        </h2>
      </div>

      {/* QR-код і дані */}
      <div className="donation-card-content">
        {/* QR-код */}
        <div 
          className="donation-card-qr"
          style={{ 
            transition: 'transform 0.3s ease',
            transform: jarUrl ? 'scale(1)' : 'scale(0.97)',
          }}
        >
          {jarUrl ? (
            <QRCode 
              value={jarUrl} 
              size={180}
              bgColor="white"
              fgColor="#000000"
              className="h-auto max-w-full w-full"
            />
          ) : (
            <div className="donation-card-qr-placeholder">
              <span className="donation-card-qr-placeholder-text">QR код недоступний</span>
            </div>
          )}
        </div>

        {/* Суми в картках */}
        <div className="donation-card-stats">
          <div 
            className="donation-card-stat"
            style={{ 
              transition: 'all 0.3s ease',
              animation: collected ? 'pulse 0.5s ease' : 'none'
            }}
          >
            <span className="donation-card-stat-label">
              Накопичено
            </span>
            <span 
              className="donation-card-stat-value"
              style={{ transition: 'color 0.3s ease' }}
            >
              {collected || '—'}
            </span>
          </div>
          <div className="donation-card-stat">
            <span className="donation-card-stat-label">
              Ціль
            </span>
            <span className="donation-card-stat-value">
              {target || '—'}
            </span>
          </div>
        </div>

        {/* Прогрес-бар */}
        <ProgressBar progress={progress} />
      </div>
    </div>
  );
});

// Визначаємо стилі анімації
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

export { DonationCard }; 