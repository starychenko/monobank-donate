import { useState, useEffect, useCallback, useRef } from 'react';
import { FundData } from '../types/donation';
import { fetchDonationData } from '../utils/api';

/**
 * Хук для роботи з даними про збір
 * @param jarUrl - URL банки Monobank
 * @returns Об'єкт з даними та методами для керування
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