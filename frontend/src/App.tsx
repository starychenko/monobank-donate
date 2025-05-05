import { useEffect, useState, useRef } from 'react'
import { DonationCard } from './components/DonationCard'
import { StatusInfo } from './components/StatusInfo'
import { useTheme } from './hooks/useTheme'
import './styles/App.css'

// Додаємо значення за замовчуванням для всіх змінних з .env
const JAR_URL = import.meta.env.VITE_MONOBANK_JAR_URL || 'https://send.monobank.ua/jar/58vdbegH3T'
const UPDATE_INTERVAL = Number(import.meta.env.VITE_UPDATE_INTERVAL) || 15000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/parse-monobank'

interface FundData {
  title: string | null
  collected: string | null
  target: string | null
}

function App() {
  // Використовуємо хук useTheme для встановлення темної теми
  useTheme();
  const [data, setData] = useState<FundData>({ title: '', collected: '', target: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined)
  const [shouldFetch, setShouldFetch] = useState(false)
  
  // Ref to track if initial fetch has been done
  const initialFetchDone = useRef(false)

  const fetchData = async () => {
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
  }

  // Handle the initial fetch when component mounts
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchData()
      initialFetchDone.current = true
    }
  }, [])

  // Handle subsequent fetches when shouldFetch changes
  useEffect(() => {
    if (shouldFetch && initialFetchDone.current) {
      fetchData()
    }
  }, [shouldFetch])

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
      <div className="container app-content">
        {/* Заголовок */}
        <header className="app-header">
          <h1 className="app-title">
            <span className="app-title-mono">mono</span>
            <span className="app-title-bank">bank</span>
            <span className="app-title-donate">Donate</span>
          </h1>
        </header>

        {/* Основний контент */}
        <main className="app-main">
          <div className="app-grid">
            {/* Картка з інформацією про збір */}
            <div className="app-card-container">
              <DonationCard
                title={data.title}
                collected={data.collected}
                target={data.target}
                jarUrl={JAR_URL}
                progress={getProgress()}
              />
            </div>

            {/* Блок статусу і інформації */}
            <div className="app-info-container">
              <StatusInfo
                loading={loading}
                error={error}
                updateInterval={UPDATE_INTERVAL}
                lastUpdated={lastUpdated}
                onCountdownComplete={() => setShouldFetch(true)}
              />

              {/* Додаткова інформація */}
              <div className="card app-info-card">
                <h3 className="app-info-title">
                  Про проєкт
                </h3>
                <p className="app-info-text">
                  Цей сервіс дозволяє відстежувати збір коштів на платформі Monobank у реальному часі.
                  Дані автоматично оновлюються для відображення актуального стану збору.
                </p>
                
                <div>
                  <a 
                    href={JAR_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="gradient-button"
                  >
                    Відкрити збір
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
