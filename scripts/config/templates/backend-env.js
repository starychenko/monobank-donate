/**
 * Шаблон .env.example файлу для backend
 */

/**
 * Повертає вміст шаблону .env.example для backend
 * @returns {string} Вміст файлу
 */
function getBackendEnvTemplate() {
  return `# URL банки за замовчуванням
DEFAULT_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Кешування
CACHE_TTL=15

# Безпека
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# HTTPS налаштування
USE_HTTPS=false
DOMAIN=localhost
SSL_KEY_PATH=
SSL_CERT_PATH=

# Режим для розробки
NODE_ENV=development

# Налаштування обмежень для rate limit
RATE_LIMIT_GLOBAL_MAX=1000
RATE_LIMIT_PARSE_MAX=100
RATE_LIMIT_BRUTEFORCE_MAX=50
REQUEST_SIZE_LIMIT=10kb

# Налаштування для puppeteer
PUPPETEER_NAVIGATION_TIMEOUT=30000
PUPPETEER_WAIT_TIMEOUT=15000
PUPPETEER_STATS_TIMEOUT=10000

# Налаштування для механізму повторних спроб
MAX_RETRIES=3
RETRY_INITIAL_DELAY=1000

# Налаштування для скріншотів
SCREENSHOTS_ENABLED=true
SCREENSHOTS_PATH=monobank-error.png`;
}

/**
 * Повертає опис змінної середовища для backend
 * @param {string} key - Ключ змінної
 * @returns {string} - Опис змінної або стандартний опис
 */
function getBackendEnvVarDescription(key) {
  const descriptions = {
    'DEFAULT_JAR_URL': 'URL банки Monobank за замовчуванням',
    'CACHE_TTL': 'Час життя кешу (секунди)',
    'ALLOWED_ORIGINS': 'Дозволені джерела для CORS (через кому)',
    'USE_HTTPS': 'Використовувати HTTPS (true/false)',
    'DOMAIN': 'Домен для підключення (наприклад: localhost, mydomain.com)',
    'SSL_KEY_PATH': 'Шлях до приватного ключа SSL',
    'SSL_CERT_PATH': 'Шлях до SSL-сертифіката',
    'NODE_ENV': 'Режим роботи (development/production)',
    'RATE_LIMIT_GLOBAL_MAX': 'Глобальний максимум запитів',
    'RATE_LIMIT_PARSE_MAX': 'Максимум запитів на парсинг',
    'RATE_LIMIT_BRUTEFORCE_MAX': 'Максимум запитів для захисту від брутфорсу',
    'REQUEST_SIZE_LIMIT': 'Обмеження розміру запиту',
    'PUPPETEER_NAVIGATION_TIMEOUT': 'Timeout для навігації (мс)',
    'PUPPETEER_WAIT_TIMEOUT': 'Timeout для очікування (мс)',
    'PUPPETEER_STATS_TIMEOUT': 'Timeout для отримання статистики (мс)',
    'MAX_RETRIES': 'Максимальна кількість повторних спроб',
    'RETRY_INITIAL_DELAY': 'Початкова затримка між спробами (мс)',
    'SCREENSHOTS_ENABLED': 'Чи зберігати скріншоти помилок (true/false)',
    'SCREENSHOTS_PATH': 'Шлях для збереження скріншотів'
  };

  return descriptions[key] || `Налаштування backend: ${key}`;
}

module.exports = {
  getBackendEnvTemplate,
  getBackendEnvVarDescription
}; 