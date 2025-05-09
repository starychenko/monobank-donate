/**
 * Модуль для керування .env файлами проекту
 */

const path = require('path');
const fs = require('fs');
const { colors, log } = require('../utils/colors');
const { frontendDir, backendDir, rootDir } = require('../utils/command-runner');
const { fileExists, writeFileContent, updateEnvValue, ensureDirectoryExists } = require('../utils/fs-helpers');
const { getFrontendEnvTemplate, getFrontendEnvVarDescription } = require('./templates/frontend-env');
const { getBackendEnvTemplate, getBackendEnvVarDescription } = require('./templates/backend-env');
const { waitForEnter } = require('../ui/prompts');

/**
 * Створює шаблон .env.example для frontend
 * @returns {string} - Вміст файлу .env.example
 */
function createFrontendEnvExample() {
  return `# URL банки Monobank
VITE_MONOBANK_JAR_URL=https://send.monobank.ua/jar/58vdbegH3T

# Інтервал оновлення даних в мілісекундах
VITE_UPDATE_INTERVAL=15000

# Налаштування сповіщень
VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT=2
VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT=5
VITE_NOTIFICATION_THRESHOLD_ABSOLUTE=1000
VITE_NOTIFICATION_PERMISSION_CHECK_INTERVAL=2000

# Налаштування HTTPS
VITE_USE_HTTPS=false
VITE_DOMAIN=localhost
VITE_API_URL=http://localhost:3001/api/parse-monobank
`;
}

/**
 * Створює шаблон .env.example для backend
 * @returns {string} - Вміст файлу .env.example
 */
function createBackendEnvExample() {
  return `# URL банки Monobank за замовчуванням
DEFAULT_JAR_URL=https://send.monobank.ua/jar/58vdbegH3T

# Час життя кешу в секундах
CACHE_TTL=15

# CORS дозволені джерела
ALLOWED_ORIGINS=http://localhost:5173,http://localhost

# Налаштування HTTPS
USE_HTTPS=false
DOMAIN=localhost

# Режим роботи (development/production)
NODE_ENV=development

# Налаштування обмежень
RATE_LIMIT_GLOBAL_MAX=1000
RATE_LIMIT_PARSE_MAX=100
RATE_LIMIT_BRUTEFORCE_MAX=50
REQUEST_SIZE_LIMIT=10kb

# Налаштування puppeteer
PUPPETEER_NAVIGATION_TIMEOUT=30000
PUPPETEER_WAIT_TIMEOUT=15000
PUPPETEER_STATS_TIMEOUT=10000

# Налаштування для механізму повторних спроб
MAX_RETRIES=3
RETRY_INITIAL_DELAY=1000

# Налаштування для скріншотів
SCREENSHOTS_ENABLED=true
SCREENSHOTS_PATH=monobank-error.png
`;
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
 * Налаштування .env файлів з автоматичним оновленням пов'язаних конфігурацій
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення в головне меню або callback для продовження
 * @param {Function} createBackup - Функція для створення резервної копії
 * @returns {Promise<void>}
 */
async function configureEnvFiles(rl, showMainMenu, createBackup) {
  log.title('=== Налаштування змінних середовища (.env файли) ===');

  // Створюємо резервну копію перед внесенням змін
  createBackup('pre-env-config');

  // Перевірка та створення файлів .env
  const frontendEnvExists = createEnvFile(frontendDir);
  const backendEnvExists = createEnvFile(backendDir);

  if (!frontendEnvExists || !backendEnvExists) {
    log.warning('Деякі .env файли не вдалося створити. Перевірте наявність директорій та прав доступу.');
  }

  // Збираємо основні налаштування в одній структурі для узгодженості
  const config = {
    frontend: {
      jarURL: 'https://send.monobank.ua/jar/58vdbegH3T',
      updateInterval: '15000',
      port: '80'
    },
    backend: {
      port: '3001',
      cacheTTL: '15'
    },
    https: {
      enabled: false,
      domain: 'localhost'
    }
  };

  console.log(`\n${colors.bright}${colors.cyan}Загальні налаштування:${colors.reset}`);
  
  // Запитуємо загальні налаштування, які впливають на обидва компоненти
  config.frontend.jarURL = await new Promise((resolve) => {
    rl.question(`${colors.yellow}URL банки Monobank (${config.frontend.jarURL}): ${colors.reset}`, (answer) => {
      resolve(answer.trim() || config.frontend.jarURL);
    });
  });
  
  // Запитуємо про HTTPS
  config.https.enabled = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Використовувати HTTPS? (y/n) ${colors.reset}`, answer => {
      const value = answer.trim().toLowerCase() === 'y';
      resolve(value);
    });
  });
  
  if (config.https.enabled) {
    config.https.domain = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Введіть домен для HTTPS (${config.https.domain}): ${colors.reset}`, (answer) => {
        resolve(answer.trim() || config.https.domain);
      });
    });
  }
  
  // Запитуємо порти
  config.frontend.port = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Порт для frontend (${config.frontend.port}): ${colors.reset}`, (answer) => {
      resolve(answer.trim() || config.frontend.port);
    });
  });
  
  config.backend.port = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Порт для backend (${config.backend.port}): ${colors.reset}`, (answer) => {
      resolve(answer.trim() || config.backend.port);
    });
  });

  // Налаштовуємо Frontend .env
  console.log(`\n${colors.bright}${colors.cyan}Frontend .env налаштування:${colors.reset}`);
  
  const frontendEnvPath = path.join(frontendDir, '.env');
  
  // Автоматично оновлюємо базові налаштування
  updateEnvValue(frontendEnvPath, 'VITE_MONOBANK_JAR_URL', config.frontend.jarURL);
  log.success(`Встановлено VITE_MONOBANK_JAR_URL=${config.frontend.jarURL}`);
  
  // Інтервал оновлення даних
  const updateInterval = await askAndSetValue(
    rl,
    'Введіть інтервал оновлення даних (мс)',
    config.frontend.updateInterval,
    frontendEnvPath,
    'VITE_UPDATE_INTERVAL'
  );
  config.frontend.updateInterval = updateInterval;
  
  // Налаштування порогів сповіщень
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
  
  // Автоматично налаштовуємо HTTPS-змінні для frontend
  updateEnvValue(frontendEnvPath, 'VITE_USE_HTTPS', config.https.enabled ? 'true' : 'false');
  log.success(`Встановлено VITE_USE_HTTPS=${config.https.enabled ? 'true' : 'false'}`);
  
  updateEnvValue(frontendEnvPath, 'VITE_DOMAIN', config.https.domain);
  log.success(`Встановлено VITE_DOMAIN=${config.https.domain}`);
  
  // Автоматично генеруємо URL API з урахуванням HTTPS
  const apiUrl = config.https.enabled
    ? `https://${config.https.domain}:${config.backend.port}/api/parse-monobank`
    : `http://${config.https.domain}:${config.backend.port}/api/parse-monobank`;
  
  updateEnvValue(frontendEnvPath, 'VITE_API_URL', apiUrl);
  log.success(`Встановлено VITE_API_URL=${apiUrl}`);
  
  // Налаштовуємо Backend .env
  console.log(`\n${colors.bright}${colors.cyan}Backend .env налаштування:${colors.reset}`);
  
  const backendEnvPath = path.join(backendDir, '.env');
  
  // Автоматично оновлюємо базові налаштування
  updateEnvValue(backendEnvPath, 'DEFAULT_JAR_URL', config.frontend.jarURL);
  log.success(`Встановлено DEFAULT_JAR_URL=${config.frontend.jarURL}`);
  
  updateEnvValue(backendEnvPath, 'PORT', config.backend.port);
  log.success(`Встановлено PORT=${config.backend.port}`);
  
  // Час життя кешу
  const cacheTTL = await askAndSetValue(
    rl,
    'Час життя кешу (секунди)',
    config.backend.cacheTTL,
    backendEnvPath,
    'CACHE_TTL'
  );
  config.backend.cacheTTL = cacheTTL;
  
  // Автоматично налаштовуємо HTTPS-змінні для backend
  updateEnvValue(backendEnvPath, 'USE_HTTPS', config.https.enabled ? 'true' : 'false');
  log.success(`Встановлено USE_HTTPS=${config.https.enabled ? 'true' : 'false'}`);
  
  updateEnvValue(backendEnvPath, 'DOMAIN', config.https.domain);
  log.success(`Встановлено DOMAIN=${config.https.domain}`);
  
  // Генеруємо CORS домени автоматично
  const allowedOrigins = config.https.enabled
    ? `https://${config.https.domain},https://${config.https.domain}:443,https://${config.https.domain}:${config.frontend.port},https://localhost:${config.frontend.port}`
    : `http://${config.https.domain},http://${config.https.domain}:${config.frontend.port},http://localhost:${config.frontend.port}`;
  
  updateEnvValue(backendEnvPath, 'ALLOWED_ORIGINS', allowedOrigins);
  log.success(`Встановлено ALLOWED_ORIGINS=${allowedOrigins}`);
  
  // Режим роботи
  await askAndSetValue(
    rl,
    'Режим роботи (development/production)',
    'development',
    backendEnvPath,
    'NODE_ENV'
  );
  
  // Інші основні налаштування backend
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
  
  log.success('\nНалаштування .env файлів завершено!');
  
  // Запитуємо, чи потрібно застосувати зміни до Docker
  const updateDocker = await new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Оновити Docker конфігурацію відповідно до нових налаштувань? (y/n) ${colors.reset}`, answer => {
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
  
  if (updateDocker) {
    // Імпортуємо модуль для генерації docker-compose файлів
    const { generateDockerComposeFiles } = require('../docker/compose-generator');
    
    log.info('Оновлення Docker конфігурації...');
    
    // Генеруємо docker-compose файли з новими налаштуваннями
    await generateDockerComposeFiles({
      frontendPort: config.frontend.port,
      backendPort: config.backend.port,
      useVolumeForFrontend: true,
      useVolumeForBackend: true,
      httpsEnabled: config.https.enabled,
      domain: config.https.domain
    });
    
    log.success('Docker конфігурація оновлена!');
  }
  
  // Якщо увімкнено HTTPS, пропонуємо налаштувати SSL-сертифікати
  if (config.https.enabled) {
    const setupSSL = await new Promise((resolve) => {
      rl.question(`\n${colors.yellow}Згенерувати SSL-сертифікати для HTTPS? (y/n) ${colors.reset}`, answer => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
    
    if (setupSSL) {
      // Імпортуємо модулі для налаштування HTTPS
      const { setupSSLCertificates } = require('../https/certificates');
      const { configureHttps } = require('../https/https-config');
      
      log.info('Генерація SSL-сертифікатів...');
      
      // Генеруємо SSL-сертифікати
      const certResult = await setupSSLCertificates(rl, config.https.domain);
      
      if (certResult.success) {
        // Налаштовуємо всі компоненти для підтримки HTTPS
        await configureHttps(rl, config.https.domain, certResult);
        log.success('HTTPS успішно налаштовано!');
      } else {
        log.error('Не вдалося згенерувати SSL-сертифікати.');
        log.warning('HTTPS налаштування не завершено. Сервіс працюватиме через HTTP.');
        
        // Повертаємо налаштування до HTTP
        updateEnvValue(frontendEnvPath, 'VITE_USE_HTTPS', 'false');
        updateEnvValue(backendEnvPath, 'USE_HTTPS', 'false');
      }
    } else {
      log.warning('SSL-сертифікати не згенеровано. Для роботи HTTPS необхідно їх згенерувати.');
      log.warning('Використайте пункт меню "Налаштувати HTTPS" для генерації сертифікатів.');
    }
  }
  
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
 * @param {boolean} checkHttps - Чи перевіряти наявність налаштувань HTTPS
 * @returns {boolean} - Чи налаштовані всі необхідні env-файли
 */
function checkEnvFiles(component = 'all', checkHttps = false) {
  const results = {
    frontend: false,
    backend: false,
    frontendHttps: false,
    backendHttps: false
  };
  
  // Перевіряємо frontend .env
  if (component === 'frontend' || component === 'all') {
    const frontendEnvPath = path.join(frontendDir, '.env');
    if (fs.existsSync(frontendEnvPath)) {
      const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
      // Перевіряємо наявність мінімально необхідних змінних
      if (envContent.includes('VITE_MONOBANK_JAR_URL=')) {
        results.frontend = true;
        
        // Перевіряємо налаштування HTTPS, якщо потрібно
        if (checkHttps) {
          if (envContent.includes('VITE_USE_HTTPS=true') && 
              envContent.includes('VITE_DOMAIN=') &&
              envContent.includes('VITE_API_URL=https://')) {
            results.frontendHttps = true;
          } else {
            log.warning('Frontend .env файл не містить налаштувань HTTPS або вони неповні');
          }
        }
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
        
        // Перевіряємо налаштування HTTPS, якщо потрібно
        if (checkHttps) {
          if (envContent.includes('USE_HTTPS=true') && 
              envContent.includes('DOMAIN=') &&
              envContent.includes('ALLOWED_ORIGINS=https://')) {
            results.backendHttps = true;
          } else {
            log.warning('Backend .env файл не містить налаштувань HTTPS або вони неповні');
          }
        }
      } else {
        log.warning('Backend .env файл існує, але не містить необхідних змінних');
      }
    } else {
      log.warning('Backend .env файл не знайдено');
    }
  }
  
  // Повертаємо результат в залежності від параметра component і checkHttps
  if (component === 'frontend') {
    return checkHttps ? results.frontend && results.frontendHttps : results.frontend;
  } else if (component === 'backend') {
    return checkHttps ? results.backend && results.backendHttps : results.backend;
  } else {
    if (checkHttps) {
      return results.frontend && results.backend && results.frontendHttps && results.backendHttps;
    } else {
      return results.frontend && results.backend;
    }
  }
}

/**
 * Створює .env файли на основі наданих значень
 * @param {Object} values - Об'єкт зі значеннями для .env файлів
 * @param {Object} values.frontend - Значення для frontend .env
 * @param {Object} values.backend - Значення для backend .env
 * @param {boolean} update - Оновлювати існуючі файли замість створення нових
 * @returns {Promise<boolean>} - Результат операції
 */
async function createEnvFiles(values, update = false) {
  try {
    // Файли frontend .env
    const frontendEnvPath = path.join(frontendDir, '.env');
    const frontendEnvExamplePath = path.join(frontendDir, '.env.example');
    
    // Файли backend .env
    const backendEnvPath = path.join(backendDir, '.env');
    const backendEnvExamplePath = path.join(backendDir, '.env.example');
    
    // Створюємо шаблони .env.example, якщо вони не існують
    if (!fileExists(frontendEnvExamplePath)) {
      log.info(`Файл .env.example не знайдено у папці ${frontendDir}`);
      const frontendExample = createFrontendEnvExample();
      fs.writeFileSync(frontendEnvExamplePath, frontendExample);
      log.success(`Створено шаблонний файл ${frontendEnvExamplePath}`);
    }
    
    if (!fileExists(backendEnvExamplePath)) {
      log.info(`Файл .env.example не знайдено у папці ${backendDir}`);
      const backendExample = createBackendEnvExample();
      fs.writeFileSync(backendEnvExamplePath, backendExample);
      log.success(`Створено шаблонний файл ${backendEnvExamplePath}`);
    }
    
    // Створюємо або оновлюємо .env файли
    let frontendEnv = '';
    let backendEnv = '';
    
    // Якщо потрібно оновити існуючі файли
    if (update && fileExists(frontendEnvPath)) {
      frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
      for (const [key, value] of Object.entries(values.frontend || {})) {
        // Якщо змінна вже існує - оновлюємо її
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (frontendEnv.match(regex)) {
          frontendEnv = frontendEnv.replace(regex, `${key}=${value}`);
        } else {
          // Якщо змінної немає - додаємо її
          frontendEnv += `\n${key}=${value}`;
        }
      }
    } else {
      // Створюємо новий файл
      const templateFrontend = createFrontendEnvExample();
      frontendEnv = templateFrontend;
      
      for (const [key, value] of Object.entries(values.frontend || {})) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (frontendEnv.match(regex)) {
          frontendEnv = frontendEnv.replace(regex, `${key}=${value}`);
        } else {
          frontendEnv += `\n${key}=${value}`;
        }
      }
    }
    
    // Так само для backend
    if (update && fileExists(backendEnvPath)) {
      backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
      for (const [key, value] of Object.entries(values.backend || {})) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (backendEnv.match(regex)) {
          backendEnv = backendEnv.replace(regex, `${key}=${value}`);
        } else {
          backendEnv += `\n${key}=${value}`;
        }
      }
    } else {
      const templateBackend = createBackendEnvExample();
      backendEnv = templateBackend;
      
      for (const [key, value] of Object.entries(values.backend || {})) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (backendEnv.match(regex)) {
          backendEnv = backendEnv.replace(regex, `${key}=${value}`);
        } else {
          backendEnv += `\n${key}=${value}`;
        }
      }
    }
    
    // Записуємо .env файли
    fs.writeFileSync(frontendEnvPath, frontendEnv);
    log.success(`Файл .env ${update ? 'оновлено' : 'створено'} у папці frontend`);
    
    fs.writeFileSync(backendEnvPath, backendEnv);
    log.success(`Файл .env ${update ? 'оновлено' : 'створено'} у папці backend`);
    
    return true;
  } catch (error) {
    log.error(`Помилка при створенні .env файлів: ${error.message}`);
    return false;
  }
}

module.exports = {
  createFrontendEnvExample,
  createBackendEnvExample,
  createEnvFile,
  askAndSetValue,
  getEnvVarDescription,
  configureEnvFiles,
  checkEnvFiles,
  createEnvFiles
}; 