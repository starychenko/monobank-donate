/**
 * Модуль для керування .env файлами проекту
 */

const path = require('path');
const fs = require('fs');
const { colors, log } = require('../utils/colors');
const { frontendDir, backendDir } = require('../utils/command-runner');
const { fileExists, writeFileContent, updateEnvValue } = require('../utils/fs-helpers');
const { getFrontendEnvTemplate, getFrontendEnvVarDescription } = require('./templates/frontend-env');
const { getBackendEnvTemplate, getBackendEnvVarDescription } = require('./templates/backend-env');

/**
 * Створює .env.example файл для frontend
 * @returns {boolean} Результат операції
 */
function createFrontendEnvExample() {
  const filePath = path.join(frontendDir, '.env.example');
  const content = getFrontendEnvTemplate();

  try {
    writeFileContent(filePath, content);
    log.success(`Створено шаблонний файл ${filePath}`);
    return true;
  } catch (error) {
    log.error(`Помилка при створенні шаблонного файлу ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Створює .env.example файл для backend
 * @returns {boolean} Результат операції
 */
function createBackendEnvExample() {
  const filePath = path.join(backendDir, '.env.example');
  const content = getBackendEnvTemplate();

  try {
    writeFileContent(filePath, content);
    log.success(`Створено шаблонний файл ${filePath}`);
    return true;
  } catch (error) {
    log.error(`Помилка при створенні шаблонного файлу ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Створює .env файл для вказаної директорії на основі .env.example
 * @param {string} dir - Директорія (frontend або backend)
 * @returns {boolean} Результат операції
 */
function createEnvFile(dir) {
  const examplePath = path.join(dir, '.env.example');
  const envPath = path.join(dir, '.env');

  if (!fs.existsSync(examplePath)) {
    log.error(`Файл .env.example не знайдено у папці ${dir}`);
    
    // Створюємо .env.example, якщо він не існує
    if (dir === frontendDir) {
      createFrontendEnvExample();
    } else if (dir === backendDir) {
      createBackendEnvExample();
    }
    
    if (!fs.existsSync(examplePath)) {
      return false;
    }
  }

  if (fs.existsSync(envPath)) {
    log.warning(`Файл .env вже існує у папці ${path.basename(dir)}`);
    return true;
  }

  try {
    // Створюємо новий .env файл з нуля замість копіювання
    if (dir === frontendDir || dir === backendDir) {
      const content = fs.readFileSync(examplePath, 'utf8');
      fs.writeFileSync(envPath, content, 'utf8');
    }
    
    log.success(`Файл .env створено у папці ${path.basename(dir)}`);
    return true;
  } catch (error) {
    log.error(`Помилка при створенні .env файлу: ${error.message}`);
    return false;
  }
}

/**
 * Запитує значення для змінної з підказкою та встановлює її у файл
 * @param {Object} rl - Інтерфейс readline
 * @param {string} question - Питання для користувача
 * @param {string} defaultValue - Значення за замовчуванням
 * @param {string} filePath - Шлях до файлу .env
 * @param {string} key - Ключ змінної
 * @returns {Promise<string>} Встановлене значення
 */
function askAndSetValue(rl, question, defaultValue, filePath, key) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} ${colors.bright}(${defaultValue})${colors.reset}${colors.yellow}:${colors.reset} `, (answer) => {
      const value = answer.trim() || defaultValue;
      if (updateEnvValue(filePath, key, value)) {
        log.success(`Встановлено ${key}=${value}`);
      }
      resolve(value);
    });
  });
}

/**
 * Повертає опис змінної середовища на основі її ключа
 * @param {string} key - Ключ змінної
 * @param {string} type - Тип змінної (frontend або backend)
 * @returns {string} Опис змінної
 */
function getEnvVarDescription(key, type) {
  if (type === 'frontend') {
    return getFrontendEnvVarDescription(key);
  } else if (type === 'backend') {
    return getBackendEnvVarDescription(key);
  }
  
  return `Значення для ${key}`;
}

/**
 * Налаштування .env файлів
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення в головне меню або callback для продовження
 * @param {Function} createBackup - Функція для створення резервної копії
 * @returns {Promise<void>}
 */
async function configureEnvFiles(rl, showMainMenu, createBackup) {
  log.title('=== Налаштування файлів .env ===');

  // Створюємо резервну копію перед внесенням змін
  createBackup('pre-env-config');

  // Перевірка та створення файлів .env
  const frontendEnvExists = createEnvFile(frontendDir);
  const backendEnvExists = createEnvFile(backendDir);

  if (!frontendEnvExists || !backendEnvExists) {
    log.warning('Деякі .env файли не вдалося створити. Перевірте наявність директорій та прав доступу.');
  }

  console.log(`\n${colors.bright}${colors.cyan}Frontend .env налаштування:${colors.reset}`);
  
  const frontendEnvPath = path.join(frontendDir, '.env');
  
  // Якщо файл не існує або користувач хоче оновити налаштування
  if (!fs.existsSync(frontendEnvPath) || (await new Promise((resolve) => {
    rl.question(`${colors.yellow}Бажаєте налаштувати frontend .env файл? (y/n) ${colors.reset}`, answer => {
      resolve(answer.trim().toLowerCase() === 'y');
    });
  }))) {
    const jarUrl = await askAndSetValue(
      rl,
      'Введіть URL банки Monobank',
      'https://send.monobank.ua/jar/58vdbegH3T',
      frontendEnvPath,
      'VITE_MONOBANK_JAR_URL'
    );
    
    await askAndSetValue(
      rl,
      'Введіть інтервал оновлення даних (мс)',
      '15000',
      frontendEnvPath,
      'VITE_UPDATE_INTERVAL'
    );
    
    console.log(`\n${colors.cyan}Налаштування порогів сповіщень:${colors.reset}`);
    
    await askAndSetValue(
      rl,
      'Поріг для сповіщень: відсоток від цільової суми (%)',
      '2',
      frontendEnvPath,
      'VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT'
    );
    
    await askAndSetValue(
      rl,
      'Поріг для сповіщень: відсоток від поточної суми (%)',
      '5',
      frontendEnvPath,
      'VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT'
    );
    
    await askAndSetValue(
      rl,
      'Поріг для сповіщень: абсолютне значення (грн)',
      '1000',
      frontendEnvPath,
      'VITE_NOTIFICATION_THRESHOLD_ABSOLUTE'
    );
    
    await askAndSetValue(
      rl,
      'Інтервал перевірки дозволу сповіщень (мс)',
      '2000',
      frontendEnvPath,
      'VITE_NOTIFICATION_PERMISSION_CHECK_INTERVAL'
    );
    
    // Додаткові налаштування для frontend, якщо вони є в .env.example
    const frontendEnvExample = fs.existsSync(path.join(frontendDir, '.env.example')) 
      ? fs.readFileSync(path.join(frontendDir, '.env.example'), 'utf8') 
      : '';
    
    // Перевіряємо наявність додаткових змінних в .env.example
    const frontendAdditionalVars = frontendEnvExample.match(/^VITE_[A-Z_]+=.+$/gm);
    if (frontendAdditionalVars) {
      const existingVars = [
        'VITE_MONOBANK_JAR_URL',
        'VITE_UPDATE_INTERVAL',
        'VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT',
        'VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT',
        'VITE_NOTIFICATION_THRESHOLD_ABSOLUTE',
        'VITE_NOTIFICATION_PERMISSION_CHECK_INTERVAL'
      ];
      
      for (const line of frontendAdditionalVars) {
        const [key, defaultValue] = line.split('=');
        if (!existingVars.includes(key)) {
          const description = getEnvVarDescription(key, 'frontend');
          await askAndSetValue(
            rl,
            `${description}`,
            defaultValue,
            frontendEnvPath,
            key
          );
        }
      }
    }
  }

  console.log(`\n${colors.bright}${colors.cyan}Backend .env налаштування:${colors.reset}`);
  
  const backendEnvPath = path.join(backendDir, '.env');
  
  // Якщо файл не існує або користувач хоче оновити налаштування
  if (!fs.existsSync(backendEnvPath) || (await new Promise((resolve) => {
    rl.question(`${colors.yellow}Бажаєте налаштувати backend .env файл? (y/n) ${colors.reset}`, answer => {
      resolve(answer.trim().toLowerCase() === 'y');
    });
  }))) {
    // Базові налаштування
    const jarUrl = await askAndSetValue(
      rl,
      'Введіть URL банки Monobank за замовчуванням',
      'https://send.monobank.ua/jar/58vdbegH3T',
      backendEnvPath,
      'DEFAULT_JAR_URL'
    );
    
    await askAndSetValue(
      rl,
      'Час життя кешу (секунди)',
      '15',
      backendEnvPath,
      'CACHE_TTL'
    );
    
    await askAndSetValue(
      rl,
      'Введіть дозволені джерела для CORS (через кому)',
      'http://localhost:5173,http://localhost',
      backendEnvPath,
      'ALLOWED_ORIGINS'
    );
    
    await askAndSetValue(
      rl,
      'Режим роботи (development/production)',
      'development',
      backendEnvPath,
      'NODE_ENV'
    );
    
    // Rate limit налаштування
    console.log(`\n${colors.cyan}Налаштування обмежень для rate limit:${colors.reset}`);
    
    await askAndSetValue(
      rl,
      'Глобальний максимум запитів',
      '1000',
      backendEnvPath,
      'RATE_LIMIT_GLOBAL_MAX'
    );
    
    await askAndSetValue(
      rl,
      'Максимум запитів на парсинг',
      '100',
      backendEnvPath,
      'RATE_LIMIT_PARSE_MAX'
    );
    
    await askAndSetValue(
      rl,
      'Максимум запитів для захисту від брутфорсу',
      '50',
      backendEnvPath,
      'RATE_LIMIT_BRUTEFORCE_MAX'
    );
    
    await askAndSetValue(
      rl,
      'Обмеження розміру запиту',
      '10kb',
      backendEnvPath,
      'REQUEST_SIZE_LIMIT'
    );
    
    // Puppeteer налаштування
    console.log(`\n${colors.cyan}Налаштування для puppeteer:${colors.reset}`);
    
    await askAndSetValue(
      rl,
      'Timeout для навігації (мс)',
      '30000',
      backendEnvPath,
      'PUPPETEER_NAVIGATION_TIMEOUT'
    );
    
    await askAndSetValue(
      rl,
      'Timeout для очікування (мс)',
      '15000',
      backendEnvPath,
      'PUPPETEER_WAIT_TIMEOUT'
    );
    
    await askAndSetValue(
      rl,
      'Timeout для отримання статистики (мс)',
      '10000',
      backendEnvPath,
      'PUPPETEER_STATS_TIMEOUT'
    );
    
    // Механізм повторних спроб
    console.log(`\n${colors.cyan}Налаштування для механізму повторних спроб:${colors.reset}`);
    
    await askAndSetValue(
      rl,
      'Максимальна кількість повторних спроб',
      '3',
      backendEnvPath,
      'MAX_RETRIES'
    );
    
    await askAndSetValue(
      rl,
      'Початкова затримка між спробами (мс)',
      '1000',
      backendEnvPath,
      'RETRY_INITIAL_DELAY'
    );
    
    // Скріншоти
    console.log(`\n${colors.cyan}Налаштування для скріншотів:${colors.reset}`);
    
    await askAndSetValue(
      rl,
      'Чи зберігати скріншоти помилок (true/false)',
      'true',
      backendEnvPath,
      'SCREENSHOTS_ENABLED'
    );
    
    await askAndSetValue(
      rl,
      'Шлях для збереження скріншотів',
      'monobank-error.png',
      backendEnvPath,
      'SCREENSHOTS_PATH'
    );
    
    // Додаткові налаштування для backend, якщо вони є в .env.example
    const backendEnvExample = fs.existsSync(path.join(backendDir, '.env.example')) 
      ? fs.readFileSync(path.join(backendDir, '.env.example'), 'utf8') 
      : '';
    
    // Перевіряємо наявність додаткових змінних в .env.example
    const backendAdditionalVars = backendEnvExample.match(/^[A-Z_]+=.+$/gm);
    if (backendAdditionalVars) {
      const existingVars = [
        'DEFAULT_JAR_URL',
        'CACHE_TTL',
        'ALLOWED_ORIGINS',
        'NODE_ENV',
        'RATE_LIMIT_GLOBAL_MAX',
        'RATE_LIMIT_PARSE_MAX',
        'RATE_LIMIT_BRUTEFORCE_MAX',
        'REQUEST_SIZE_LIMIT',
        'PUPPETEER_NAVIGATION_TIMEOUT',
        'PUPPETEER_WAIT_TIMEOUT',
        'PUPPETEER_STATS_TIMEOUT',
        'MAX_RETRIES',
        'RETRY_INITIAL_DELAY',
        'SCREENSHOTS_ENABLED',
        'SCREENSHOTS_PATH'
      ];
      
      for (const line of backendAdditionalVars) {
        const [key, defaultValue] = line.split('=');
        if (!existingVars.includes(key)) {
          const description = getEnvVarDescription(key, 'backend');
          await askAndSetValue(
            rl,
            `${description}`,
            defaultValue,
            backendEnvPath,
            key
          );
        }
      }
    }
  }

  log.success('\nНалаштування .env файлів завершено!');
  
  // Перевіряємо, чи це виклик з configureAll або звичайний виклик
  // Якщо callback - це асинхронна функція, то це виклик з configureAll
  const isAsyncCallback = showMainMenu.constructor.name === 'AsyncFunction';
  
  if (!isAsyncCallback) {
    // Стандартний випадок - повертаємося до головного меню
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
  } else {
    // Викликаємо callback для продовження процесу налаштування
    await showMainMenu();
  }
}

/**
 * Перевіряє наявність і коректність .env файлів
 * @param {string} component - Компонент для перевірки ('frontend', 'backend' або 'all')
 * @returns {boolean} - Чи налаштовані всі необхідні env-файли
 */
function checkEnvFiles(component = 'all') {
  const results = {
    frontend: false,
    backend: false
  };
  
  // Перевіряємо frontend .env
  if (component === 'frontend' || component === 'all') {
    const frontendEnvPath = path.join(frontendDir, '.env');
    if (fs.existsSync(frontendEnvPath)) {
      const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
      // Перевіряємо наявність мінімально необхідних змінних
      if (envContent.includes('VITE_MONOBANK_JAR_URL=')) {
        results.frontend = true;
      } else {
        log.warning('Frontend .env файл існує, але не містить необхідних змінних');
      }
    } else {
      log.warning('Frontend .env файл не знайдено');
    }
  }
  
  // Перевіряємо backend .env
  if (component === 'backend' || component === 'all') {
    const backendEnvPath = path.join(backendDir, '.env');
    if (fs.existsSync(backendEnvPath)) {
      const envContent = fs.readFileSync(backendEnvPath, 'utf8');
      // Перевіряємо наявність мінімально необхідних змінних
      if (envContent.includes('DEFAULT_JAR_URL=')) {
        results.backend = true;
      } else {
        log.warning('Backend .env файл існує, але не містить необхідних змінних');
      }
    } else {
      log.warning('Backend .env файл не знайдено');
    }
  }
  
  // Повертаємо результат в залежності від параметра component
  if (component === 'frontend') {
    return results.frontend;
  } else if (component === 'backend') {
    return results.backend;
  } else {
    return results.frontend && results.backend;
  }
}

module.exports = {
  createFrontendEnvExample,
  createBackendEnvExample,
  createEnvFile,
  askAndSetValue,
  getEnvVarDescription,
  configureEnvFiles,
  checkEnvFiles
}; 