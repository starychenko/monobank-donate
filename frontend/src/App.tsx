import { useEffect, useState, useRef, useCallback } from 'react'
import { DonationCard } from './components/DonationCard'
import { StatusInfo } from './components/StatusInfo'
import { useTheme } from './hooks/useTheme'

// Додаємо значення за замовчуванням для всіх змінних з .env
const JAR_URL = import.meta.env.VITE_MONOBANK_JAR_URL || 'https://send.monobank.ua/jar/58vdbegH3T'
const UPDATE_INTERVAL = Number(import.meta.env.VITE_UPDATE_INTERVAL) || 15000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/parse-monobank'

interface FundData {
  title: string | null
  collected: string | null
  target: string | null
  description?: string
}

function App() {
  // Використовуємо хук useTheme для встановлення темної теми
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<FundData>({ 
    title: '', 
    collected: '', 
    target: '',
    description: 'Збираємо кошти для ремонту авто Toyota Hilux яка потребує капітального ремонту двигуна, реставрації кардану, заміни щеплення, відновлення ходової частини'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined)
  const [shouldFetch, setShouldFetch] = useState(false)
  
  // Ref to track if initial fetch has been done
  const initialFetchDone = useRef(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: JAR_URL }),
      })
      
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
      
      const json = await res.json()
      
      // Валідація та очищення даних на стороні клієнта
      const cleanData = {
        title: typeof json.title === 'string' ? json.title : 'Назва збору',
        collected: typeof json.collected === 'string' ? json.collected : '',
        target: typeof json.target === 'string' ? json.target : '',
        description: data.description // Зберігаємо поточний опис
      };
      
      setData(cleanData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося отримати дані')
      console.error('Помилка запиту:', err)
    } finally {
      setLoading(false)
      setShouldFetch(false)
    }
  }, [data.description]);

  // Handle the initial fetch when component mounts
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchData()
      initialFetchDone.current = true
    }
  }, [fetchData])

  // Handle subsequent fetches when shouldFetch changes
  useEffect(() => {
    if (shouldFetch && initialFetchDone.current) {
      fetchData()
    }
  }, [shouldFetch, fetchData])

  // Прогрес-бар - покращена функція для правильної обробки чисел
  const getProgress = () => {
    // Видаляємо всі нецифрові символи, окрім крапки, для підтримки різних форматів
    const cleanValue = (value: string | null): number => {
      if (!value) return 0;
      // Залишаємо тільки цифри і крапку, потім перетворюємо в число
      const numericString = value.replace(/[^\d.]/g, '');
      return parseFloat(numericString) || 0;
    };

    const collected = cleanValue(data.collected);
    const target = cleanValue(data.target);
    
    if (!collected || !target) return 0;
    return Math.min((collected / target) * 100, 100);
  }

  return (
    <div className="app-container">
      {/* Заголовок - переміщено за межі контейнера app-content для кращої видимості */}
      <header className="app-header">
        <div className="container header-container">
          <h1 className="app-title">
            <span className="app-title-mono">mono</span>
            <span className="app-title-bank">bank</span>
            <span className="app-title-donate">Donate</span>
          </h1>
          
          {/* Кнопка перемикання теми */}
          <button 
            className="theme-toggle-button"
            onClick={toggleTheme}
            aria-label="Перемкнути тему"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>
      
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
                progress={getProgress()}
              />
            </div>

            {/* Блок статусу і інформації про збір */}
            <div className="app-info-container">
              <StatusInfo
                loading={loading}
                error={error}
                updateInterval={UPDATE_INTERVAL}
                lastUpdated={lastUpdated}
                onCountdownComplete={() => setShouldFetch(true)}
              />

              {/* Інформація про збір */}
              <div className="card app-info-card">
                <h3 className="app-info-title">
                  Збір для 41 ОМБ
                </h3>
                <p className="app-info-text">
                  {data.description}
                </p>
                
                <div>
                  <a 
                    href={JAR_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="gradient-button"
                  >
                    Долучитись до збору
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="button-icon" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Про проєкт - розміщено над футером */}
      <div className="app-about-wrapper">
        <div className="container">
          <div className="app-about-section">
            <div className="card app-about-card">
              <h3 className="app-about-title">
                Про проєкт
              </h3>
              <p className="app-about-text">
                Цей сервіс дозволяє відстежувати збір коштів на платформі Monobank у реальному часі.
                Дані автоматично оновлюються для відображення актуального стану збору.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Футер */}
      <footer className="app-footer">
        <div className="container">
          <div className="app-footer-content">
            <div className="app-footer-brand">
              <span className="app-footer-year">&copy; {new Date().getFullYear()}</span>
              <span className="app-footer-mono">mono</span>
              <span className="app-footer-bank">bank</span>
              <span className="app-footer-donate">Donate</span>
            </div>
            <span className="app-footer-separator">|</span>
            <span className="app-footer-credits">
              Всі дані беруться з офіційного сайту Monobank
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
