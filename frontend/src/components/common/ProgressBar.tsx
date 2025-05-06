import { memo } from 'react';

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  label?: string;
}

/**
 * Компонент ProgressBar - відображає прогрес-бар з відсотком виконання
 * Мемоізований для оптимізації продуктивності
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