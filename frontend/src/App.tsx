import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import './index.css'

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
  const [data, setData] = useState<FundData>({ title: '', collected: '', target: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: JAR_URL }),
      })
      const json = await res.json()
      setData(json)
    } catch {
      setError('Не вдалося отримати дані')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, UPDATE_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Прогрес-бар
  const getProgress = () => {
    const collected = Number((data.collected || '').replace(/\D/g, ''))
    const target = Number((data.target || '').replace(/\D/g, ''))
    if (!collected || !target) return 0
    return Math.min((collected / target) * 100, 100)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb] p-2">
      <div className="bg-white/80 rounded-3xl shadow-xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
        {/* Ліва частина: Інфо про збір */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="mb-4">
            {/* Додаємо перевірку на JAR_URL перед відображенням QR-коду */}
            {JAR_URL ? (
              <QRCode value={JAR_URL} size={120} />
            ) : (
              <div className="w-[120px] h-[120px] flex items-center justify-center bg-gray-200 rounded">
                <span className="text-sm text-gray-500">QR код недоступний</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700 mb-1">{data.title || 'Назва збору'}</div>
            <div className="text-xs text-gray-500 mb-2">{JAR_URL || 'Посилання не вказано'}</div>
            <div className="flex flex-row justify-center gap-4 mt-4">
              <div className="bg-gray-100 rounded-xl px-4 py-2 flex flex-col items-center">
                <span className="text-xs text-gray-500">Накопичено</span>
                <span className="font-bold text-xl text-[#6c47a3]">{data.collected || '—'}</span>
              </div>
              <div className="bg-gray-100 rounded-xl px-4 py-2 flex flex-col items-center">
                <span className="text-xs text-gray-500">Ціль</span>
                <span className="font-bold text-xl text-[#6c47a3]">{data.target || '—'}</span>
              </div>
            </div>
            {/* Прогрес-бар */}
            <div className="w-full mt-6">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-[#a18cd1] to-[#6c47a3] h-4 rounded-full transition-all"
                  style={{ width: `${getProgress()}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {getProgress().toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
        {/* Права частина: Статус/Завантаження/Помилка */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/60">
          {loading ? (
            <div className="text-gray-500">Завантаження...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="text-center text-gray-700 text-lg">Статус збору оновлюється кожні {UPDATE_INTERVAL / 1000} сек.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
