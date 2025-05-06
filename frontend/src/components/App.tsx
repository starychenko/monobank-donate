import { useTheme } from '../hooks/useTheme';
import { useDonationData } from '../hooks/useDonationData';
import { getProgress } from '../utils/formatters';
import { JAR_URL, UPDATE_INTERVAL } from '../constants/api';

// Компоненти верстки
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';
import { AboutSection } from './layout/AboutSection';

// Компоненти для збору
import { DonationCard } from './donation/DonationCard';
import { StatusInfo } from './donation/StatusInfo';

// Спільні компоненти
import { InfoCard } from './common/InfoCard';

/**
 * Головний компонент додатку, який об'єднує всі інші компоненти
 */
function App() {
  // Використовуємо хук useTheme для керування темою
  const { theme, toggleTheme } = useTheme();
  
  // Використовуємо хук useDonationData для отримання даних про збір
  const { 
    data, 
    loading, 
    error, 
    lastUpdated, 
    triggerUpdate 
  } = useDonationData(JAR_URL);

  return (
    <div className="app-container">
      {/* Шапка сайту */}
      <Header theme={theme} onToggleTheme={toggleTheme} />
      
      <div className="container app-content">
        {/* Основний контент */}
        <main className="app-main">
          <div className="app-grid">
            {/* Картка з інформацією про збір */}
            <div className="app-card-container">
              <DonationCard
                collected={data.collected}
                target={data.target}
                jarUrl={JAR_URL}
                progress={getProgress(data.collected, data.target)}
              />
            </div>

            {/* Блок статусу і інформації про збір */}
            <div className="app-info-container">
              <StatusInfo
                loading={loading}
                error={error}
                updateInterval={UPDATE_INTERVAL}
                lastUpdated={lastUpdated}
                onCountdownComplete={triggerUpdate}
              />

              {/* Інформація про збір */}
              <InfoCard 
                title="Збір для 41 ОМБ"
                description={data.description || ''}
                jarUrl={JAR_URL}
              />
            </div>
          </div>
        </main>
      </div>
      
      {/* Про проєкт */}
      <AboutSection />

      {/* Футер */}
      <Footer />
    </div>
  );
}

export default App; 