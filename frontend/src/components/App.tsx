import { DonationCard } from './donation/DonationCard';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';
import { InfoCard } from './common/InfoCard';
import { StatusInfo } from './donation/StatusInfo';
import { AboutSection } from './layout/AboutSection';
import { useDonationData } from '../hooks/useDonationData';
import { useTheme } from '../hooks/useTheme';
import { useEffect, useRef } from 'react';
import { cleanValue } from '../utils/formatters';
import { NotificationPrompt } from './common/NotificationPrompt';
import { notifyDonationChange, registerServiceWorker } from '../utils/notifications';
import { JAR_URL, UPDATE_INTERVAL } from '../constants/api';

/**
 * Головний компонент додатку
 */
export function App() {
  const { theme, toggleTheme } = useTheme();
  const { data, loading, error, lastUpdated, triggerUpdate } = useDonationData(JAR_URL);
  const previousAmountRef = useRef<number | null>(null);
  
  // Ініціалізуємо сервіс-воркер при першому завантаженні
  useEffect(() => {
    registerServiceWorker();
  }, []);
  
  // Відстежуємо зміни в даних донату
  useEffect(() => {
    // Якщо даних немає, не робимо нічого
    if (!data?.collected || loading) return;
    
    // Конвертуємо значення в числа
    const current = cleanValue(data.collected);
    const target = cleanValue(data.target || '0');
    
    // Отримуємо попереднє значення (якщо є)
    const previous = previousAmountRef.current;
    
    // Оновлюємо попереднє значення
    previousAmountRef.current = current;
    
    // Якщо попереднього значення немає, просто зберігаємо поточне
    if (previous === null) return;
    
    // Якщо сума збільшилась, перевіряємо чи треба показати сповіщення
    if (current > previous) {
      notifyDonationChange(current, previous, target);
    }
  }, [data, loading]);
  
  // Обчислюємо прогрес для відображення
  const progress = data?.collected && data?.target 
    ? Math.min(Math.round((cleanValue(data.collected) / cleanValue(data.target)) * 100), 100)
    : 0;
  
  return (
    <div className={`app-container ${theme}`}>
      <Header theme={theme} onToggleTheme={toggleTheme} />
      
      <main className="app-content">
        <div className="container px-4 py-4 mx-auto">
          {/* Використовуємо гнучкіший підхід до сітки */}
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 justify-center">
            {/* Колонка з QR-кодом - адаптивна ширина з максимальним обмеженням */}
            <div className="flex-1 max-w-[420px] mx-auto lg:mx-0 w-full">
              <DonationCard
                collected={data?.collected}
                target={data?.target}
                jarUrl={JAR_URL}
                progress={progress}
              />
            </div>
            
            {/* Колонка з інформацією - адаптивна ширина з максимальним обмеженням */}
            <div className="flex-1 max-w-[420px] mx-auto lg:mx-0 w-full">
              <StatusInfo 
                loading={loading} 
                error={error} 
                lastUpdated={lastUpdated}
                updateInterval={UPDATE_INTERVAL}
                onCountdownComplete={triggerUpdate}
              />
              <div className="mt-5">
                <InfoCard 
                  title="Збір для ЗСУ" 
                  description={data?.description || 'Опис збору відсутній'} 
                  jarUrl={JAR_URL} 
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <AboutSection />
      <Footer />
      <NotificationPrompt />
    </div>
  );
} 