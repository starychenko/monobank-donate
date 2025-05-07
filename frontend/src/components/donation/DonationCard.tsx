import { memo } from 'react';
import QRCode from 'react-qr-code';
import { ProgressBar } from '../common/ProgressBar';
import { AnimatedValue } from '../common/AnimatedValue';

/**
 * Інтерфейс для властивостей компонента DonationCard
 * 
 * @property {string|null} collected - Сума зібраних коштів у форматованому вигляді
 * @property {string|null} target - Цільова сума збору у форматованому вигляді
 * @property {string} jarUrl - URL посилання на банку Monobank для QR-коду
 * @property {number} progress - Відсоток виконання збору (від 0 до 100)
 */
interface DonationCardProps {
  collected: string | null;
  target: string | null;
  jarUrl: string;
  progress: number;
}

/**
 * Компонент DonationCard - відображає QR-код для пожертвування та статистику збору
 * 
 * Відображає картку з QR-кодом для швидкого доступу до сторінки збору коштів,
 * а також інформацію про поточний статус збору: зібрану суму, цільову суму та
 * прогрес-бар із відсотком виконання. Компонент мемоізований для оптимізації
 * продуктивності при часткових оновленнях даних.
 * 
 * @param {DonationCardProps} props - Властивості компонента
 * @param {string|null} props.collected - Сума зібраних коштів у форматованому вигляді
 * @param {string|null} props.target - Цільова сума збору у форматованому вигляді
 * @param {string} props.jarUrl - URL посилання на банку Monobank для QR-коду
 * @param {number} props.progress - Відсоток виконання збору (від 0 до 100)
 * 
 * @example
 * // Базовий приклад
 * <DonationCard
 *   collected="45 000 ₴"
 *   target="100 000 ₴"
 *   jarUrl="https://send.monobank.ua/jar/123456789"
 *   progress={45}
 * />
 */
const DonationCard = memo(function DonationCard({ 
  collected, 
  target, 
  jarUrl, 
  progress 
}: DonationCardProps) {
  return (
    <div className="card donation-card w-full md:max-w-[480px] box-border m-0">
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
            <AnimatedValue 
              value={collected} 
              className="donation-card-stat-value"
            />
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

export { DonationCard }; 