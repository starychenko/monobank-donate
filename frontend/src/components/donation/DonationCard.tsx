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
    <div className="card donation-card w-full rounded-lg overflow-hidden">
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
              size={200}
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
          {/* Ліва частина - Накопичено */}
          <div className="donation-card-stat">
            <span className="donation-card-stat-label">
              Накопичено
            </span>
            <div className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="donation-card-icon">
                <path d="M4.7999 3.59961C4.16338 3.59961 3.55293 3.85247 3.10285 4.30255C2.65276 4.75264 2.3999 5.36309 2.3999 5.99961C2.3999 6.63613 2.65276 7.24658 3.10285 7.69667C3.55293 8.14675 4.16338 8.39961 4.7999 8.39961H19.1999C19.8364 8.39961 20.4469 8.14675 20.897 7.69667C21.347 7.24658 21.5999 6.63613 21.5999 5.99961C21.5999 5.36309 21.347 4.75264 20.897 4.30255C20.4469 3.85247 19.8364 3.59961 19.1999 3.59961H4.7999Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M3.6001 9.59961H20.4001V17.9996C20.4001 18.6361 20.1472 19.2466 19.6972 19.6967C19.2471 20.1468 18.6366 20.3996 18.0001 20.3996H6.0001C5.36358 20.3996 4.75313 20.1468 4.30304 19.6967C3.85295 19.2466 3.6001 18.6361 3.6001 17.9996V9.59961ZM9.6001 13.1996C9.6001 12.8813 9.72653 12.5761 9.95157 12.3511C10.1766 12.126 10.4818 11.9996 10.8001 11.9996H13.2001C13.5184 11.9996 13.8236 12.126 14.0486 12.3511C14.2737 12.5761 14.4001 12.8813 14.4001 13.1996C14.4001 13.5179 14.2737 13.8231 14.0486 14.0481C13.8236 14.2732 13.5184 14.3996 13.2001 14.3996H10.8001C10.4818 14.3996 10.1766 14.2732 9.95157 14.0481C9.72653 13.8231 9.6001 13.5179 9.6001 13.1996Z" fill="currentColor"/>
              </svg>
              <AnimatedValue 
                value={collected} 
                className="donation-card-stat-value"
              />
            </div>
          </div>
          
          {/* Вертикальний розділювач */}
          <div className="donation-stats-divider"></div>
          
          {/* Права частина - Ціль */}
          <div className="donation-card-stat">
            <span className="donation-card-stat-label">
              Ціль
            </span>
            <div className="flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="donation-card-icon">
                <path fillRule="evenodd" clipRule="evenodd" d="M14.8741 3.06441C14.798 2.91205 14.6904 2.77762 14.5584 2.67006C14.4264 2.56251 14.273 2.48428 14.1084 2.44058C13.9438 2.39688 13.7718 2.38871 13.6038 2.41661C13.4358 2.44451 13.2757 2.50785 13.1341 2.60241C12.7201 2.87841 12.3973 3.27201 12.1477 3.65841C11.8909 4.05441 11.6641 4.51401 11.4637 4.99761C11.0629 5.96241 10.7269 7.11921 10.4557 8.27841C10.1277 9.69499 9.88211 11.1294 9.7201 12.5744C9.23186 12.2596 8.83956 11.8167 8.5861 11.294C8.1925 10.478 8.1085 9.45321 8.1085 8.10921C8.10845 7.87191 8.03805 7.63995 7.90619 7.44266C7.77432 7.24536 7.58693 7.0916 7.36769 7.00079C7.14845 6.90999 6.90721 6.88622 6.67447 6.93251C6.44172 6.97879 6.22793 7.09303 6.0601 7.26081C5.2791 8.04013 4.65974 8.96606 4.23758 9.98542C3.81542 11.0048 3.59878 12.0975 3.6001 13.2008C3.6002 14.5821 3.94096 15.9422 4.59219 17.1604C5.24342 18.3786 6.18502 19.4174 7.3336 20.1847C8.48218 20.9521 9.80228 21.4244 11.177 21.5598C12.5517 21.6951 13.9385 21.4894 15.2147 20.9608C16.4909 20.4321 17.617 19.5969 18.4934 18.5291C19.3697 17.4613 19.9692 16.1939 20.2387 14.8391C20.5082 13.4843 20.4394 12.084 20.0385 10.7621C19.6376 9.44022 18.9168 8.23761 17.9401 7.26081C17.2297 6.55161 16.7641 6.07881 16.3225 5.50041C15.8869 4.92921 15.4537 4.22481 14.8741 3.06441ZM14.5441 18.1448C14.0406 18.6476 13.3995 18.99 12.7016 19.1286C12.0036 19.2673 11.2803 19.196 10.6229 18.9238C9.96545 18.6516 9.40344 18.1906 9.00782 17.5992C8.6122 17.0078 8.40073 16.3124 8.4001 15.6008C8.4001 15.6008 9.4549 16.2008 11.4001 16.2008C11.4001 15.0008 12.0001 11.4008 12.9001 10.8008C13.5001 12.0008 13.8433 12.3524 14.5453 13.0556C14.8801 13.3894 15.1457 13.7861 15.3267 14.2229C15.5078 14.6597 15.6007 15.128 15.6001 15.6008C15.6007 16.0736 15.5078 16.5419 15.3267 16.9787C15.1457 17.4155 14.8801 17.8122 14.5453 18.146L14.5441 18.1448Z" fill="currentColor"/>
              </svg>
              <span className="donation-card-stat-value">
                {target || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Прогрес-бар */}
        <ProgressBar progress={progress} />
      </div>
    </div>
  );
});

export { DonationCard }; 