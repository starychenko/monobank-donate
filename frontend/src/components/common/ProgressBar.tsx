import { memo } from 'react';

/**
 * Інтерфейс для властивостей компонента ProgressBar
 * 
 * @property {number} progress - Відсоток прогресу (від 0 до 100)
 * @property {boolean} [showPercentage=true] - Чи відображати відсоток прогресу текстом
 * @property {string} [label='Прогрес'] - Текстова мітка для прогрес-бару
 */
interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  label?: string;
}

/**
 * Компонент ProgressBar - відображає прогрес-бар з відсотком виконання
 * 
 * Відображає горизонтальний прогрес-бар з анімацією заповнення та
 * опціональним показником відсотків. Мемоізований для оптимізації продуктивності,
 * щоб запобігти зайвим рендерам при незмінних властивостях.
 * 
 * @param {ProgressBarProps} props - Властивості компонента
 * @param {number} props.progress - Відсоток прогресу (від 0 до 100)
 * @param {boolean} [props.showPercentage=true] - Чи відображати відсоток прогресу текстом
 * @param {string} [props.label='Прогрес'] - Текстова мітка для прогрес-бару
 * 
 * @example
 * // Базовий приклад
 * <ProgressBar progress={75} />
 * 
 * @example
 * // З кастомною міткою, без відсотків
 * <ProgressBar 
 *   progress={42} 
 *   showPercentage={false} 
 *   label="Завершено" 
 * />
 */
const ProgressBar = memo(function ProgressBar({ 
  progress, 
  showPercentage = true, 
  label = 'Прогрес' 
}: ProgressBarProps) {
  // Обмежуємо значення прогресу від 0 до 100 для безпеки
  const clampedProgress = Math.min(Math.max(0, progress), 100);
  
  return (
    <div className="donation-card-progress">
      <div className="donation-card-progress-bar">
        <div
          className="donation-card-progress-value"
          style={{ 
            width: `${clampedProgress}%`,
            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' 
          }}
        ></div>
      </div>
      
      {showPercentage && (
        <div className="donation-card-progress-text">
          <span className="donation-card-progress-label">
            {label}
          </span>
          <span 
            className="donation-card-progress-percent"
            style={{ transition: 'all 0.5s ease' }}
          >
            {clampedProgress.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
});

export { ProgressBar }; 