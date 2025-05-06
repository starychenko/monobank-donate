import { API_URL } from '../constants/api';
import { FundData } from '../types/donation';

/**
 * Функції для роботи з API
 */

/**
 * Отримує дані про збір з API
 * @param jarUrl - URL банки Monobank
 * @returns Дані про збір
 * @throws Помилку, якщо запит не вдався
 */
export const fetchDonationData = async (jarUrl: string): Promise<FundData> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: jarUrl }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    
    // Перевіряємо, чи маємо детальну інформацію про помилку
    if (errorData && errorData.errors && Array.isArray(errorData.errors)) {
      throw new Error(errorData.errors.map((e: {msg: string}) => e.msg).join(', '));
    } else if (errorData && errorData.error) {
      throw new Error(errorData.error);
    } else {
      throw new Error(`Помилка сервера ${res.status}`);
    }
  }
  
  const json = await res.json();
  
  // Валідація та очищення даних на стороні клієнта
  return {
    title: typeof json.title === 'string' ? json.title : 'Назва збору',
    collected: typeof json.collected === 'string' ? json.collected : '',
    target: typeof json.target === 'string' ? json.target : '',
  };
}; 