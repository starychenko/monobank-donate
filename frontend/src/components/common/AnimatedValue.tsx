import { useEffect, useState, useRef } from 'react';
import { cleanValue } from '../../utils/formatters';

interface AnimatedValueProps {
  value: string | null;
  className?: string;
  formatter?: (value: number) => string;
  duration?: number;
}

/**
 * Компонент для анімованого відображення числових значень
 * 
 * @param {string | null} value - Значення для відображення (може бути форматованим, наприклад "1 000 ₴")
 * @param {string} [className] - CSS клас для стилізації
 * @param {Function} [formatter] - Функція для форматування числового значення
 * @param {number} [duration=800] - Тривалість анімації в мс
 * 
 * @example
 * <AnimatedValue value="48 710 ₴" />
 */
export function AnimatedValue({ 
  value, 
  className = '', 
  formatter = (val) => val.toLocaleString('uk-UA') + ' ₴',
  duration = 800
}: AnimatedValueProps) {
  // Отримуємо числове значення з рядка
  const numericValue = value ? cleanValue(value) : 0;
  
  // Стан для зберігання поточного відображуваного числа
  const [displayValue, setDisplayValue] = useState(numericValue);
  
  // Зберігаємо попереднє значення для анімації
  const prevValueRef = useRef(numericValue);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (prevValueRef.current === numericValue) return;
    
    const startValue = prevValueRef.current;
    const endValue = numericValue;
    const difference = endValue - startValue;
    
    // Якщо різниця незначна, просто встановлюємо значення без анімації
    if (Math.abs(difference) < 1) {
      setDisplayValue(endValue);
      prevValueRef.current = endValue;
      return;
    }
    
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
      const progress = Math.min(elapsed / duration, 1);
      
      // Використовуємо функцію пом'якшення (easing) для більш природної анімації
      const easedProgress = easeOutQuart(progress);
      
      // Розраховуємо поточне значення
      const currentValue = startValue + difference * easedProgress;
      setDisplayValue(currentValue);
      
      // Продовжуємо анімацію, якщо не досягнуто кінця
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Завершуємо анімацію
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
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
  }, [numericValue, duration]);
  
  // Функція пом'якшення (easing function)
  const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
  
  return (
    <span className={className}>
      {formatter(Math.floor(displayValue))}
    </span>
  );
} 