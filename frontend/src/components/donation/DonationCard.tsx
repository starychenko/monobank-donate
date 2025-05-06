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
 */
export function DonationCard({ collected, target, jarUrl, progress }: DonationCardProps) {
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
        <div className="donation-card-qr">
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
          <div className="donation-card-stat">
            <span className="donation-card-stat-label">
              Накопичено
            </span>
            <span className="donation-card-stat-value">
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
} 