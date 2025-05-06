interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  label?: string;
}

/**
 * Компонент ProgressBar - відображає прогрес-бар з відсотком виконання
 */
export function ProgressBar({ progress, showPercentage = true, label = 'Прогрес' }: ProgressBarProps) {
  return (
    <div className="donation-card-progress">
      <div className="donation-card-progress-bar">
        <div
          className="donation-card-progress-value"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {showPercentage && (
        <div className="donation-card-progress-text">
          <span className="donation-card-progress-label">
            {label}
          </span>
          <span className="donation-card-progress-percent">
            {progress.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
} 