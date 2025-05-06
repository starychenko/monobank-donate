import { useState, useEffect, useCallback, useRef } from 'react';
import { FundData } from '../types/donation';
import { fetchDonationData } from '../utils/api';

/**
 * Хук для отримання та керування даними про збір коштів у Monobank
 * 
 * @param {string} jarUrl - URL банки Monobank для отримання даних про збір
 * @returns {Object} Об'єкт з даними та методами для керування
 * @returns {FundData} .data - Дані про збір (заголовок, зібрана сума, ціль, опис)
 * @returns {boolean} .loading - Прапорець, що вказує на стан завантаження даних
 * @returns {string|null} .error - Текст помилки, якщо така сталася, або null
 * @returns {Date|undefined} .lastUpdated - Дата та час останнього успішного оновлення даних
 * @returns {Function} .triggerUpdate - Функція для ініціювання оновлення даних
 * 
 * @example
 * // Базове використання
 * const { data, loading, error, lastUpdated, triggerUpdate } = useDonationData(
 *   'https://send.monobank.ua/jar/123456789'
 * );
 * 
 * // Виведення даних
 * if (loading) return <div>Завантаження...</div>;
 * if (error) return <div>Помилка: {error}</div>;
 * return (
 *   <div>
 *     <h2>{data.title}</h2>
 *     <p>Зібрано: {data.collected}</p>
 *     <p>Ціль: {data.target}</p>
 *     <button onClick={triggerUpdate}>Оновити дані</button>
 *   </div>
 * );
 */
export function useDonationData(jarUrl: string) {
  const [data, setData] = useState<FundData>({ 
    title: '', 
    collected: '', 
    target: '',
    description: 'Збираємо кошти для ремонту авто Toyota Hilux яка потребує капітального ремонту двигуна, реставрації кардану, заміни щеплення, відновлення ходової частини'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Ref для відстеження початкового завантаження
  const initialFetchDone = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDonationData(jarUrl);
      setData(prev => ({...result, description: prev.description}));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося отримати дані');
      console.error('Помилка запиту:', err);
    } finally {
      setLoading(false);
      setShouldFetch(false);
    }
  }, [jarUrl]);

  // Початкове завантаження при монтуванні компонента
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchData();
      initialFetchDone.current = true;
    }
  }, [fetchData]);

  // Обробка наступних оновлень при зміні shouldFetch
  useEffect(() => {
    if (shouldFetch && initialFetchDone.current) {
      fetchData();
    }
  }, [shouldFetch, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    triggerUpdate: () => setShouldFetch(true)
  };
} 