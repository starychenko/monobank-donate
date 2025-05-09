/**
 * Шаблон .env.example файлу для frontend
 */

/**
 * Повертає вміст шаблону .env.example для frontend
 * @returns {string} Вміст файлу
 */
function getFrontendEnvTemplate() {
  return `# URL збору Monobank
VITE_MONOBANK_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Інтервал оновлення в мс (15 секунд)
VITE_UPDATE_INTERVAL=15000

# HTTPS налаштування
VITE_USE_HTTPS=false
VITE_DOMAIN=localhost
VITE_API_URL=http://localhost:3001/api/parse-monobank

# Налаштування сповіщень
# Поріг для сповіщень: відсоток від цільової суми (%)
VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT=2
# Поріг для сповіщень: відсоток від поточної суми (%)
VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT=5
# Поріг для сповіщень: абсолютне значення (грн)
VITE_NOTIFICATION_THRESHOLD_ABSOLUTE=1000
# Інтервал перевірки дозволу сповіщень (мс)
VITE_NOTIFICATION_PERMISSION_CHECK_INTERVAL=2000`;
}

/**
 * Повертає опис змінної середовища для frontend
 * @param {string} key - Ключ змінної
 * @returns {string} - Опис змінної або стандартний опис
 */
function getFrontendEnvVarDescription(key) {
  const descriptions = {
    'VITE_MONOBANK_JAR_URL': 'URL банки Monobank',
    'VITE_UPDATE_INTERVAL': 'Інтервал оновлення даних (мс)',
    'VITE_USE_HTTPS': 'Використовувати HTTPS (true/false)',
    'VITE_DOMAIN': 'Домен для підключення (наприклад: localhost, mydomain.com)',
    'VITE_API_URL': 'URL для API бекенду (із протоколом, повний)',
    'VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT': 'Поріг для сповіщень: відсоток від цільової суми (%)',
    'VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT': 'Поріг для сповіщень: відсоток від поточної суми (%)',
    'VITE_NOTIFICATION_THRESHOLD_ABSOLUTE': 'Поріг для сповіщень: абсолютне значення (грн)',
    'VITE_NOTIFICATION_PERMISSION_CHECK_INTERVAL': 'Інтервал перевірки дозволу сповіщень (мс)'
  };

  return descriptions[key] || `Налаштування frontend: ${key.replace('VITE_', '')}`;
}

module.exports = {
  getFrontendEnvTemplate,
  getFrontendEnvVarDescription
}; 