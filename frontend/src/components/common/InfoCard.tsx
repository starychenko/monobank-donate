import { memo } from 'react';

/**
 * Інтерфейс для властивостей компонента InfoCard
 * 
 * @property {string} title - Заголовок інформаційної картки
 * @property {string} description - Детальний опис збору коштів
 * @property {string} jarUrl - URL посилання на банку Monobank
 */
interface InfoCardProps {
  title: string;
  description: string;
  jarUrl: string;
}

/**
 * Компонент InfoCard - відображає інформаційну картку зі збором
 * 
 * Відображає картку з інформацією про збір коштів, включаючи заголовок, опис
 * та кнопку для переходу на сторінку збору. Мемоізований для оптимізації
 * продуктивності при перемальовуванні батьківських компонентів.
 * 
 * @param {InfoCardProps} props - Властивості компонента
 * @param {string} props.title - Заголовок інформаційної картки
 * @param {string} props.description - Детальний опис збору коштів
 * @param {string} props.jarUrl - URL посилання на банку Monobank
 * 
 * @example
 * // Базовий приклад
 * <InfoCard
 *   title="Допомога ЗСУ"
 *   description="Збір коштів на тепловізор для підрозділу"
 *   jarUrl="https://send.monobank.ua/jar/123456789"
 * />
 */
const InfoCard = memo(function InfoCard({ title, description, jarUrl }: InfoCardProps) {
  return (
    <div className="card app-info-card">
      <h3 className="app-info-title">
        {title}
      </h3>
      <p className="app-info-text">
        {description}
      </p>
      
      <div>
        <a 
          href={jarUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="gradient-button"
          style={{ 
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <span style={{ 
            position: 'relative', 
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            Долучитись до збору
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="button-icon" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
});

export { InfoCard }; 