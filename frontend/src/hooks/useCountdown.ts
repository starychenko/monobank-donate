import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Хук для створення зворотного відліку
 * @param duration - Тривалість відліку в мілісекундах
 * @param autoRestart - Чи потрібно автоматично перезапускати відлік
 * @param onComplete - Функція, яка викликається при завершенні відліку
 * @param resetOnChange - Якщо true, таймер перезапускається при зміні duration
 * @returns Об'єкт з секундами та функціями керування
 */
export function useCountdown(
  duration: number,
  autoRestart: boolean = false,
  onComplete?: () => void,
  resetOnChange: boolean = false
) {
  const [seconds, setSeconds] = useState<number>(Math.floor(duration / 1000));
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wasCompletedRef = useRef<boolean>(false);

  // Використовуємо useCallback для мемоізації функції
  const restart = useCallback(() => {
    // Очищаємо попередній таймер, якщо він є
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSeconds(Math.floor(duration / 1000));
    wasCompletedRef.current = false;
  }, [duration]);

  // Ефект для перезапуску таймера при зміні duration
  useEffect(() => {
    if (resetOnChange) {
      restart();
    }
  }, [duration, resetOnChange, restart]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    // Якщо секунди закінчились, викликаємо onComplete
    if (seconds <= 0) {
      if (onComplete && !wasCompletedRef.current) {
        wasCompletedRef.current = true;
        onComplete();
      }
      
      if (autoRestart) {
        restart();
      }
      return;
    }

    // Запускаємо інтервал для відліку
    timerRef.current = setInterval(() => {
      setSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    // Очищаємо інтервал при розмонтуванні або зміні залежностей
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [seconds, onComplete, autoRestart, isPaused, restart]);

  return {
    seconds,
    restart,
    pause,
    resume,
    isRunning: !isPaused && seconds > 0
  };
} 