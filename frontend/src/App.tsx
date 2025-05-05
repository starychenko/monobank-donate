import { useEffect, useState, useRef } from 'react'
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
        throw new Error(`HTTP error ${res.status}`)
      }
      
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Не вдалося отримати дані')
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

  // Прогрес-бар
  const getProgress = () => {
    const collected = Number((data.collected || '').replace(/\D/g, ''))
    const target = Number((data.target || '').replace(/\D/g, ''))
    if (!collected || !target) return 0
    return Math.min((collected / target) * 100, 100)
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      height: '100%',
      transition: 'background-color var(--theme-transition-duration) var(--theme-transition-timing)'
    }}>
      <div className="container" style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Заголовок */}
        <header style={{ padding: '2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ 
            fontSize: 'var(--font-size-3xl)', 
            fontWeight: 'var(--font-weight-bold)', 
            display: 'flex', 
            alignItems: 'center',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.01em',
            margin: 0
          }}>
            <span style={{ 
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-light)',
              transition: 'none'
            }}>mono</span>
            <span style={{ 
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--mono-yellow)',
              transition: 'none'
            }}>bank</span>
            <span style={{ 
              marginLeft: '0.5rem',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 'var(--font-weight-normal)',
              transition: 'none'
            }}>Donate</span>
          </h1>
        </header>

        {/* Основний контент */}
        <main style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          flex: 1
        }}>
          <div style={{ 
            width: '100%', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {/* Картка з інформацією про збір */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <DonationCard
                title={data.title}
                collected={data.collected}
                target={data.target}
                jarUrl={JAR_URL}
                progress={getProgress()}
              />
            </div>

            {/* Блок статусу і інформації */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <StatusInfo
                loading={loading}
                error={error}
                updateInterval={UPDATE_INTERVAL}
                lastUpdated={lastUpdated}
                onCountdownComplete={() => setShouldFetch(true)}
              />

              {/* Додаткова інформація */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ 
                  fontSize: 'var(--font-size-xl)', 
                  fontWeight: 'var(--font-weight-semibold)', 
                  marginBottom: '1rem',
                  fontFamily: 'var(--font-heading)'
                }}>
                  Про проєкт
                </h3>
                <p style={{ 
                  marginBottom: '1.5rem', 
                  lineHeight: 'var(--line-height-relaxed)', 
                  color: 'rgba(255,255,255,0.8)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--font-size-base)'
                }}>
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
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1rem', height: '1rem', marginLeft: '0.5rem' }} viewBox="0 0 20 20" fill="currentColor">
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
      <footer style={{ 
        width: '100%',
        textAlign: 'center', 
        padding: '1.5rem 0', 
        marginTop: 'auto',
        color: 'rgba(255,255,255,0.7)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(28,28,30,0.95)',
        transition: 'color var(--theme-transition-duration) var(--theme-transition-timing), background-color var(--theme-transition-duration) var(--theme-transition-timing), border-color var(--theme-transition-duration) var(--theme-transition-timing)'
      }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.75rem',
            fontFamily: 'var(--font-ui)',
            fontWeight: 'var(--font-weight-medium)',
            fontSize: 'var(--font-size-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '0.35rem' }}>&copy; {new Date().getFullYear()}</span>
              <span style={{ 
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-light)',
                transition: 'none'
              }}>mono</span>
              <span style={{ 
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--mono-yellow)',
                transition: 'none'
              }}>bank</span>
              <span style={{ 
                marginLeft: '0.2rem',
                fontWeight: 'var(--font-weight-normal)',
                transition: 'none'
              }}>Donate</span>
            </div>
            <span style={{ 
              fontSize: 'var(--font-size-xs)', 
              opacity: 0.8, 
              color: 'rgba(255,255,255,0.6)'
            }}>|</span>
            <span style={{ 
              fontSize: 'var(--font-size-xs)', 
              opacity: 0.8, 
              color: 'rgba(255,255,255,0.6)'
            }}>
              Всі дані беруться з офіційного сайту Monobank
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
