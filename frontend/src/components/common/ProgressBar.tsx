import { memo, useEffect, useState, useRef } from 'react';

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
  
  // Стан для анімованих значень
  const [displayProgress, setDisplayProgress] = useState(clampedProgress);
  const [displayPercentage, setDisplayPercentage] = useState(clampedProgress);
  
  // Референції для анімації
  const prevProgressRef = useRef(clampedProgress);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Константа для тривалості анімації
  const animationDuration = 800;
  
  useEffect(() => {
    if (prevProgressRef.current === clampedProgress) return;
    
    const startValue = prevProgressRef.current;
    const endValue = clampedProgress;
    const difference = endValue - startValue;
    
    // Скасовуємо попередню анімацію, якщо така є
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Функція анімації за допомогою requestAnimationFrame
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Використовуємо функцію пом'якшення (easing) для більш природної анімації
      const easedProgress = easeOutQuart(progress);
      
      // Розраховуємо поточне значення
      const currentValue = startValue + difference * easedProgress;
      setDisplayProgress(currentValue);
      setDisplayPercentage(currentValue);
      
      // Продовжуємо анімацію, якщо не досягнуто кінця
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Завершуємо анімацію
        setDisplayProgress(endValue);
        setDisplayPercentage(endValue);
        prevProgressRef.current = endValue;
        startTimeRef.current = null;
        animationRef.current = null;
      }
    };
    
    // Запускаємо анімацію
    animationRef.current = requestAnimationFrame(animate);
    
    // Очищення при розмонтуванні або зміні значення
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clampedProgress]);
  
  // Функція пом'якшення (easing function)
  const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
  
  return (
    <div className="donation-card-progress">
      <div className="donation-card-progress-bar">
        <div
          className="donation-card-progress-value"
          style={{ 
            width: `${displayProgress}%`,
            transition: 'none' // Вимикаємо CSS-transition, оскільки анімуємо через JS
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
          >
            {displayPercentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
});

export { ProgressBar }; 