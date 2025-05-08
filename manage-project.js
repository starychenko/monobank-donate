#!/usr/bin/env node

/**
 * Центральний скрипт для налаштування та керування проектом Monobank Donate
 * - Встановлює залежності у папках frontend та backend
 * - Створює та налаштовує .env файли
 * - Запускає проект у різних режимах (локально або через Docker)
 * - Керує Docker-контейнерами
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Директорії проекту
const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

// Кольори для консолі
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Створення інтерактивного інтерфейсу
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Виконує команду у вказаній директорії
 */
function runCommand(command, cwd) {
  try {
    console.log(`${colors.cyan}Виконується команда:${colors.reset} ${command} ${colors.cyan}у папці${colors.reset} ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}Помилка при виконанні команди ${command}:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Запуск команди Docker Compose
 */
function runDockerCompose(command, detached = false) {
  const args = command.split(' ');
  const options = detached ? ['-d'] : [];
  const fullCommand = ['docker-compose', ...args, ...options];
  
  console.log(`${colors.blue}Виконую: ${colors.cyan}${fullCommand.join(' ')}${colors.reset}`);
  
  const child = spawn(fullCommand[0], fullCommand.slice(1), { stdio: 'inherit' });
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}Команда завершилась з кодом ${code}${colors.reset}`);
    }
  });
  
  return child;
}

/**
 * Перевірка наявності Docker
 */
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    // Додаткова перевірка, що Docker Engine працює
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Перевірка наявності Docker Compose
 */
function checkDockerCompose() {
  try {
    execSync('docker-compose --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Створює .env файл з .env.example
 */
function createEnvFile(dir) {
  const examplePath = path.join(dir, '.env.example');
  const envPath = path.join(dir, '.env');

  if (!fs.existsSync(examplePath)) {
    console.error(`${colors.red}Файл .env.example не знайдено у папці ${dir}${colors.reset}`);
    
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
    console.log(`${colors.yellow}Файл .env вже існує у папці ${path.basename(dir)}${colors.reset}`);
    return true;
  }

  try {
    // Створюємо новий .env файл з нуля замість копіювання
    if (dir === frontendDir) {
      const content = fs.readFileSync(examplePath, 'utf8');
      fs.writeFileSync(envPath, content, 'utf8');
    } else if (dir === backendDir) {
      const content = fs.readFileSync(examplePath, 'utf8');
      fs.writeFileSync(envPath, content, 'utf8');
    }
    
    console.log(`${colors.green}Файл .env створено у папці ${path.basename(dir)}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Помилка при створенні .env файлу:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Створює шаблонний файл .env.example для frontend
 */
function createFrontendEnvExample() {
  const filePath = path.join(frontendDir, '.env.example');
  const content = `# URL збору Monobank
VITE_MONOBANK_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Інтервал оновлення в мс (15 секунд)
VITE_UPDATE_INTERVAL=15000

# Налаштування сповіщень
# Поріг для сповіщень: відсоток від цільової суми (%)
VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT=2
# Поріг для сповіщень: відсоток від поточної суми (%)
VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT=5
# Поріг для сповіщень: абсолютне значення (грн)
VITE_NOTIFICATION_THRESHOLD_ABSOLUTE=1000
# Інтервал перевірки дозволу сповіщень (мс)
VITE_NOTIFICATION_PERMISSION_CHECK_INTERVAL=2000`;

  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${colors.green}Створено шаблонний файл ${filePath}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Помилка при створенні шаблонного файлу ${filePath}:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Створює шаблонний файл .env.example для backend
 */
function createBackendEnvExample() {
  const filePath = path.join(backendDir, '.env.example');
  const content = `# URL банки за замовчуванням
DEFAULT_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Кешування
CACHE_TTL=15

# Безпека
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

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

  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${colors.green}Створено шаблонний файл ${filePath}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Помилка при створенні шаблонного файлу ${filePath}:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Оновлює значення в .env файлі
 */
function updateEnvValue(filePath, key, value) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const updatedLines = lines.map(line => {
      if (line.startsWith(key + '=')) {
        return `${key}=${value}`;
      }
      return line;
    });
    fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf8');
    return true;
  } catch (error) {
    console.error(`${colors.red}Помилка при оновленні файлу ${filePath}:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Запитує значення для змінної з підказкою та встановлює її у файл
 */
function askAndSetValue(question, defaultValue, filePath, key) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} ${colors.bright}(${defaultValue})${colors.reset}${colors.yellow}:${colors.reset} `, (answer) => {
      const value = answer.trim() || defaultValue;
      if (updateEnvValue(filePath, key, value)) {
        console.log(`${colors.green}Встановлено ${key}=${value}${colors.reset}`);
      }
      resolve(value);
    });
  });
}

/**
 * Налаштування .env файлів
 */
async function configureEnvFiles() {
  console.log(`\n${colors.bright}${colors.yellow}=== Налаштування файлів .env ===${colors.reset}\n`);

  // Створюємо резервну копію перед внесенням змін
  createBackup('pre-env-config');

  // Перевірка та створення файлів .env
  const frontendEnvExists = createEnvFile(frontendDir);
  const backendEnvExists = createEnvFile(backendDir);

  if (!frontendEnvExists || !backendEnvExists) {
    console.log(`${colors.yellow}Деякі .env файли не вдалося створити. Перевірте наявність директорій та прав доступу.${colors.reset}`);
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
      'Введіть URL банки Monobank',
      'https://send.monobank.ua/jar/58vdbegH3T',
      frontendEnvPath,
      'VITE_MONOBANK_JAR_URL'
    );
    
    await askAndSetValue(
      'Введіть інтервал оновлення даних (мс)',
      '15000',
      frontendEnvPath,
      'VITE_UPDATE_INTERVAL'
    );
    
    console.log(`\n${colors.cyan}Налаштування порогів сповіщень:${colors.reset}`);
    
    await askAndSetValue(
      'Поріг для сповіщень: відсоток від цільової суми (%)',
      '2',
      frontendEnvPath,
      'VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT'
    );
    
    await askAndSetValue(
      'Поріг для сповіщень: відсоток від поточної суми (%)',
      '5',
      frontendEnvPath,
      'VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT'
    );
    
    await askAndSetValue(
      'Поріг для сповіщень: абсолютне значення (грн)',
      '1000',
      frontendEnvPath,
      'VITE_NOTIFICATION_THRESHOLD_ABSOLUTE'
    );
    
    await askAndSetValue(
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
      'Введіть URL банки Monobank за замовчуванням',
      'https://send.monobank.ua/jar/58vdbegH3T',
      backendEnvPath,
      'DEFAULT_JAR_URL'
    );
    
    await askAndSetValue(
      'Час життя кешу (секунди)',
      '15',
      backendEnvPath,
      'CACHE_TTL'
    );
    
    await askAndSetValue(
      'Введіть дозволені джерела для CORS (через кому)',
      'http://localhost:5173,http://localhost',
      backendEnvPath,
      'ALLOWED_ORIGINS'
    );
    
    await askAndSetValue(
      'Режим роботи (development/production)',
      'development',
      backendEnvPath,
      'NODE_ENV'
    );
    
    // Rate limit налаштування
    console.log(`\n${colors.cyan}Налаштування обмежень для rate limit:${colors.reset}`);
    
    await askAndSetValue(
      'Глобальний максимум запитів',
      '1000',
      backendEnvPath,
      'RATE_LIMIT_GLOBAL_MAX'
    );
    
    await askAndSetValue(
      'Максимум запитів на парсинг',
      '100',
      backendEnvPath,
      'RATE_LIMIT_PARSE_MAX'
    );
    
    await askAndSetValue(
      'Максимум запитів для захисту від брутфорсу',
      '50',
      backendEnvPath,
      'RATE_LIMIT_BRUTEFORCE_MAX'
    );
    
    await askAndSetValue(
      'Обмеження розміру запиту',
      '10kb',
      backendEnvPath,
      'REQUEST_SIZE_LIMIT'
    );
    
    // Puppeteer налаштування
    console.log(`\n${colors.cyan}Налаштування для puppeteer:${colors.reset}`);
    
    await askAndSetValue(
      'Timeout для навігації (мс)',
      '30000',
      backendEnvPath,
      'PUPPETEER_NAVIGATION_TIMEOUT'
    );
    
    await askAndSetValue(
      'Timeout для очікування (мс)',
      '15000',
      backendEnvPath,
      'PUPPETEER_WAIT_TIMEOUT'
    );
    
    await askAndSetValue(
      'Timeout для отримання статистики (мс)',
      '10000',
      backendEnvPath,
      'PUPPETEER_STATS_TIMEOUT'
    );
    
    // Механізм повторних спроб
    console.log(`\n${colors.cyan}Налаштування для механізму повторних спроб:${colors.reset}`);
    
    await askAndSetValue(
      'Максимальна кількість повторних спроб',
      '3',
      backendEnvPath,
      'MAX_RETRIES'
    );
    
    await askAndSetValue(
      'Початкова затримка між спробами (мс)',
      '1000',
      backendEnvPath,
      'RETRY_INITIAL_DELAY'
    );
    
    // Скріншоти
    console.log(`\n${colors.cyan}Налаштування для скріншотів:${colors.reset}`);
    
    await askAndSetValue(
      'Чи зберігати скріншоти помилок (true/false)',
      'true',
      backendEnvPath,
      'SCREENSHOTS_ENABLED'
    );
    
    await askAndSetValue(
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
            `${description}`,
            defaultValue,
            backendEnvPath,
            key
          );
        }
      }
    }
  }

  console.log(`\n${colors.green}Налаштування .env файлів завершено!${colors.reset}`);
  
  await new Promise(resolve => {
    rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
  });
  
  showMainMenu();
}

/**
 * Повертає опис змінної середовища на основі її ключа
 */
function getEnvVarDescription(key, type) {
  const descriptions = {
    // Frontend
    'VITE_MONOBANK_JAR_URL': 'URL банки Monobank',
    'VITE_UPDATE_INTERVAL': 'Інтервал оновлення даних (мс)',
    'VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT': 'Поріг для сповіщень: відсоток від цільової суми (%)',
    'VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT': 'Поріг для сповіщень: відсоток від поточної суми (%)',
    'VITE_NOTIFICATION_THRESHOLD_ABSOLUTE': 'Поріг для сповіщень: абсолютне значення (грн)',
    'VITE_NOTIFICATION_PERMISSION_CHECK_INTERVAL': 'Інтервал перевірки дозволу сповіщень (мс)',

    // Backend
    'DEFAULT_JAR_URL': 'URL банки Monobank за замовчуванням',
    'CACHE_TTL': 'Час життя кешу (секунди)',
    'ALLOWED_ORIGINS': 'Дозволені джерела для CORS (через кому)',
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

  // Якщо опис знайдено, повертаємо його
  if (descriptions[key]) {
    return descriptions[key];
  }

  // Якщо опису немає, генеруємо стандартний опис
  if (type === 'frontend' && key.startsWith('VITE_')) {
    return `Налаштування frontend: ${key.replace('VITE_', '')}`;
  } else if (type === 'backend') {
    return `Налаштування backend: ${key}`;
  }

  return `Значення для ${key}`;
}

/**
 * Початкове налаштування проекту
 */
async function initialSetup() {
  console.log(`\n${colors.bright}${colors.yellow}=== Початкове налаштування проекту ===${colors.reset}\n`);

  // 1. Перевірка наявності Node.js
  console.log(`${colors.cyan}Перевірка вимог...${colors.reset}`);
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`${colors.green}Node.js: ${nodeVersion}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Node.js не встановлено! Будь ласка, встановіть Node.js версії 16 або вище.${colors.reset}`);
    return;
  }

  // 2. Встановлення залежностей Backend
  console.log(`\n${colors.cyan}Встановлення залежностей backend...${colors.reset}`);
  if (runCommand('npm install', backendDir)) {
    console.log(`${colors.green}Залежності backend успішно встановлені!${colors.reset}`);
  } else {
    console.error(`${colors.red}Помилка при встановленні залежностей backend!${colors.reset}`);
  }

  // 3. Встановлення залежностей Frontend
  console.log(`\n${colors.cyan}Встановлення залежностей frontend...${colors.reset}`);
  if (runCommand('npm install', frontendDir)) {
    console.log(`${colors.green}Залежності frontend успішно встановлені!${colors.reset}`);
  } else {
    console.error(`${colors.red}Помилка при встановленні залежностей frontend!${colors.reset}`);
  }

  // 4. Створення та налаштування .env файлів
  await configureEnvFiles();
}

/**
 * Функція для створення резервних копій важливих файлів конфігурації
 */
function createBackup(type = 'auto') {
  console.log(`${colors.cyan}Створюємо резервні копії конфігурації...${colors.reset}`);
  
  const backupDir = path.join(rootDir, 'backups');
  
  // Створюємо директорію для бекапів, якщо вона не існує
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Формуємо ім'я для резервної копії з датою і часом
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${type}-backup-${timestamp}`;
  const backupPath = path.join(backupDir, backupName);
  
  // Створюємо директорію для поточної резервної копії
  fs.mkdirSync(backupPath, { recursive: true });
  
  try {
    // Копіюємо конфігураційні файли
    const filesToBackup = [
      { path: 'docker-compose.yml', required: false },
      { path: 'docker-compose.dev.yml', required: false },
      { path: path.join('frontend', '.env'), required: false },
      { path: path.join('backend', '.env'), required: false }
    ];
    
    let backedUpFiles = 0;
    
    for (const file of filesToBackup) {
      const fullPath = path.join(rootDir, file.path);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const targetPath = path.join(backupPath, file.path.replace(/\//g, '-'));
        fs.writeFileSync(targetPath, content, 'utf8');
        backedUpFiles++;
      } else if (file.required) {
        console.log(`${colors.yellow}Попередження: Файл ${file.path} не знайдено для створення резервної копії${colors.reset}`);
      }
    }
    
    if (backedUpFiles > 0) {
      console.log(`${colors.green}Створено резервну копію ${backedUpFiles} файлів у папці: ${colors.reset}${backupPath}`);
      return backupPath;
    } else {
      console.log(`${colors.yellow}Не знайдено файлів для створення резервної копії${colors.reset}`);
      fs.rmdirSync(backupPath); // Видаляємо порожню директорію
      return null;
    }
  } catch (error) {
    console.error(`${colors.red}Помилка при створенні резервної копії: ${error.message}${colors.reset}`);
    return null;
  }
}

/**
 * Функція для відновлення з резервної копії
 */
async function restoreFromBackup() {
  console.log(`\n${colors.bright}${colors.yellow}=== Відновлення з резервної копії ===${colors.reset}\n`);
  
  const backupDir = path.join(rootDir, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.log(`${colors.yellow}Резервних копій не знайдено${colors.reset}`);
    
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
    return;
  }
  
  // Отримуємо список директорій резервних копій
  const backups = fs.readdirSync(backupDir)
    .filter(item => fs.statSync(path.join(backupDir, item)).isDirectory())
    .sort((a, b) => {
      const timeA = fs.statSync(path.join(backupDir, a)).mtime.getTime();
      const timeB = fs.statSync(path.join(backupDir, b)).mtime.getTime();
      return timeB - timeA; // Сортуємо за часом створення (нові спочатку)
    });
  
  if (backups.length === 0) {
    console.log(`${colors.yellow}Резервних копій не знайдено${colors.reset}`);
    
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
    return;
  }
  
  // Виводимо список резервних копій
  console.log(`${colors.cyan}Доступні резервні копії:${colors.reset}`);
  
  backups.forEach((backup, index) => {
    const backupPath = path.join(backupDir, backup);
    const backupStat = fs.statSync(backupPath);
    const backupDate = backupStat.mtime.toLocaleString();
    
    // Отримуємо список файлів у резервній копії
    const backupFiles = fs.readdirSync(backupPath).length;
    
    console.log(`${colors.green}${index + 1}.${colors.reset} ${backup} (${backupDate}, ${backupFiles} файлів)`);
  });
  
  // Запитуємо користувача, яку резервну копію відновити
  const backupIndex = await new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Виберіть резервну копію для відновлення (1-${backups.length}) або 0 для скасування: ${colors.reset}`, (answer) => {
      const index = parseInt(answer.trim(), 10);
      if (isNaN(index) || index < 0 || index > backups.length) {
        resolve(0);
      } else {
        resolve(index);
      }
    });
  });
  
  if (backupIndex === 0) {
    console.log(`${colors.yellow}Відновлення скасовано${colors.reset}`);
    
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
    return;
  }
  
  const selectedBackup = backups[backupIndex - 1];
  const backupPath = path.join(backupDir, selectedBackup);
  
  // Отримуємо список файлів у резервній копії
  const backupFiles = fs.readdirSync(backupPath);
  
  console.log(`\n${colors.cyan}Файли для відновлення:${colors.reset}`);
  backupFiles.forEach(file => {
    console.log(`${colors.green}-${colors.reset} ${file}`);
  });
  
  // Запитуємо підтвердження
  const confirm = await new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Ви впевнені, що хочете відновити ці файли? (y/n): ${colors.reset}`, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
  
  if (!confirm) {
    console.log(`${colors.yellow}Відновлення скасовано${colors.reset}`);
    
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
    return;
  }
  
  // Створюємо резервну копію поточних файлів перед відновленням
  createBackup('pre-restore');
  
  // Відновлюємо файли
  try {
    let restoredFiles = 0;
    
    for (const file of backupFiles) {
      const sourceContent = fs.readFileSync(path.join(backupPath, file), 'utf8');
      let targetPath;
      
      // Визначаємо шлях для відновлення файлу
      if (file.startsWith('docker-compose')) {
        targetPath = path.join(rootDir, file);
      } else if (file.startsWith('frontend-.env')) {
        targetPath = path.join(rootDir, 'frontend', '.env');
      } else if (file.startsWith('backend-.env')) {
        targetPath = path.join(rootDir, 'backend', '.env');
      } else {
        console.log(`${colors.yellow}Пропускаємо файл ${file} - невідомий формат${colors.reset}`);
        continue;
      }
      
      // Створюємо директорії, якщо вони не існують
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Записуємо вміст файлу
      fs.writeFileSync(targetPath, sourceContent, 'utf8');
      console.log(`${colors.green}Відновлено файл: ${colors.reset}${targetPath}`);
      restoredFiles++;
    }
    
    console.log(`\n${colors.green}Успішно відновлено ${restoredFiles} файлів з резервної копії${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Помилка при відновленні з резервної копії: ${error.message}${colors.reset}`);
  }
  
  await new Promise(resolve => {
    rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
  });
  
  showMainMenu();
}

/**
 * Запуск проекту у режимі розробки через Docker
 */
function startDevelopment() {
  console.log(`${colors.yellow}Запуск проекту в режимі розробки...${colors.reset}`);
  
  // Перевіряємо наявність файлу docker-compose.dev.yml
  if (!fs.existsSync('docker-compose.dev.yml')) {
    console.log(`${colors.yellow}Файл docker-compose.dev.yml не знайдено. Створюємо...${colors.reset}`);
    
    // Використовуємо функцію для генерації docker-compose файлів
    generateDockerComposeFiles({
      frontendPort: '80',
      backendPort: '3001',
      useVolumeForFrontend: true,
      useVolumeForBackend: true
    });
  }
  
  // Запускаємо Docker Compose з dev-конфігурацією
  const child = runDockerCompose('-f docker-compose.dev.yml up --build', true);
  
  console.log(`${colors.green}Проект запущено у режимі розробки!${colors.reset}`);
  console.log(`${colors.blue}Фронтенд доступний за адресою: ${colors.cyan}http://localhost:80${colors.reset}`);
  console.log(`${colors.blue}Бекенд доступний за адресою: ${colors.cyan}http://localhost:3001${colors.reset}`);
  console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
  
  rl.once('line', () => {
    showMainMenu();
  });
}

/**
 * Запуск проекту у продакшн режимі через Docker
 */
function startProduction() {
  console.log(`${colors.yellow}Запуск проекту в продакшн режимі...${colors.reset}`);
  
  // Перевіряємо наявність файлу docker-compose.yml
  if (!fs.existsSync('docker-compose.yml')) {
    console.log(`${colors.yellow}Файл docker-compose.yml не знайдено. Створюємо...${colors.reset}`);
    
    // Використовуємо функцію для генерації docker-compose файлів
    generateDockerComposeFiles({
      frontendPort: '80',
      backendPort: '3001',
      useVolumeForFrontend: false,
      useVolumeForBackend: false
    });
  }
  
  // Запускаємо Docker Compose з prod-конфігурацією
  const child = runDockerCompose('up --build', true);
  
  console.log(`${colors.green}Проект запущено у продакшн режимі!${colors.reset}`);
  console.log(`${colors.blue}Фронтенд доступний за адресою: ${colors.cyan}http://localhost:80${colors.reset}`);
  console.log(`${colors.blue}Бекенд доступний за адресою: ${colors.cyan}http://localhost:3001${colors.reset}`);
  console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
  
  rl.once('line', () => {
    showMainMenu();
  });
}

/**
 * Зупиняє Docker контейнери
 */
function stopContainers() {
  console.log(`${colors.yellow}Зупинка контейнерів...${colors.reset}`);
  
  try {
    // Перевіряємо наявність файлу docker-compose.dev.yml
    const devFileExists = fs.existsSync('docker-compose.dev.yml');
    
    if (devFileExists) {
      console.log(`${colors.blue}Зупиняємо контейнери для режиму розробки...${colors.reset}`);
      execSync('docker-compose -f docker-compose.dev.yml down', { stdio: 'inherit' });
    }
    
    // Також зупиняємо контейнери для продакшну
    console.log(`${colors.blue}Зупиняємо контейнери для продакшн режиму...${colors.reset}`);
    execSync('docker-compose down', { stdio: 'inherit' });
    
    console.log(`${colors.green}Контейнери успішно зупинені!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Помилка при зупинці контейнерів: ${error.message}${colors.reset}`);
  }
  
  console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
  
  rl.once('line', () => {
    showMainMenu();
  });
}

/**
 * Показує логи Docker контейнерів
 */
function showLogs() {
  console.log(`${colors.yellow}Вибір логів для відображення:${colors.reset}`);
  console.log(`${colors.green}1.${colors.reset} Логи режиму розробки`);
  console.log(`${colors.green}2.${colors.reset} Логи продакшн режиму`);
  console.log(`${colors.green}3.${colors.reset} Повернутися до меню`);
  
  rl.question(`\n${colors.yellow}Ваш вибір (1-3): ${colors.reset}`, (choice) => {
    let composeFile = '';
    
    switch (choice) {
      case '1':
        composeFile = '-f docker-compose.dev.yml';
        break;
      case '2':
        composeFile = '';
        break;
      case '3':
        showMainMenu();
        return;
      default:
        console.log(`${colors.red}Некоректний вибір!${colors.reset}`);
        setTimeout(showLogs, 1000);
        return;
    }
    
    console.log(`${colors.yellow}Натисніть Ctrl+C, щоб зупинити відображення логів...${colors.reset}\n`);
    
    try {
      execSync(`docker-compose ${composeFile} logs -f`, { stdio: 'inherit' });
    } catch (error) {
      // Ігноруємо помилку, яка виникає при натисканні Ctrl+C
    }
    
    console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
    
    rl.once('line', () => {
      showMainMenu();
    });
  });
}

/**
 * Перебудовує проект у Docker
 */
function rebuildProject() {
  console.log(`${colors.yellow}Вибір режиму для перебудови:${colors.reset}`);
  console.log(`${colors.green}1.${colors.reset} Перебудувати режим розробки`);
  console.log(`${colors.green}2.${colors.reset} Перебудувати продакшн режим`);
  console.log(`${colors.green}3.${colors.reset} Перебудувати обидва режими`);
  console.log(`${colors.green}4.${colors.reset} Повернутися до меню`);
  
  rl.question(`\n${colors.yellow}Ваш вибір (1-4): ${colors.reset}`, (choice) => {
    switch (choice) {
      case '1':
        console.log(`${colors.blue}Перебудова контейнерів для режиму розробки...${colors.reset}`);
        execSync('docker-compose -f docker-compose.dev.yml build --no-cache', { stdio: 'inherit' });
        break;
      case '2':
        console.log(`${colors.blue}Перебудова контейнерів для продакшн режиму...${colors.reset}`);
        execSync('docker-compose build --no-cache', { stdio: 'inherit' });
        break;
      case '3':
        console.log(`${colors.blue}Перебудова контейнерів для режиму розробки...${colors.reset}`);
        execSync('docker-compose -f docker-compose.dev.yml build --no-cache', { stdio: 'inherit' });
        console.log(`${colors.blue}Перебудова контейнерів для продакшн режиму...${colors.reset}`);
        execSync('docker-compose build --no-cache', { stdio: 'inherit' });
        break;
      case '4':
        showMainMenu();
        return;
      default:
        console.log(`${colors.red}Некоректний вибір!${colors.reset}`);
        setTimeout(rebuildProject, 1000);
        return;
    }
    
    console.log(`${colors.green}Перебудова завершена!${colors.reset}`);
    console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
    
    rl.once('line', () => {
      showMainMenu();
    });
  });
}

/**
 * Запуск backend локально
 */
function startBackend() {
  console.log(`${colors.cyan}Запуск backend...${colors.reset}`);
  
  try {
    const child = spawn('npm', ['run', 'dev'], { 
      cwd: backendDir,
      stdio: 'inherit',
      shell: true
    });
    
    console.log(`${colors.green}Бекенд запущено! Натисніть Ctrl+C для зупинки.${colors.reset}`);
    
    child.on('close', (code) => {
      if (code !== null) {
        console.log(`\n${colors.yellow}Бекенд зупинено. Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
        
        rl.once('line', () => {
          showMainMenu();
        });
      }
    });
  } catch (error) {
    console.error(`${colors.red}Помилка при запуску backend: ${error.message}${colors.reset}`);
    
    console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
    
    rl.once('line', () => {
      showMainMenu();
    });
  }
}

/**
 * Запуск frontend локально
 */
function startFrontend() {
  console.log(`${colors.cyan}Запуск frontend...${colors.reset}`);
  
  try {
    const child = spawn('npm', ['run', 'dev'], { 
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true
    });
    
    console.log(`${colors.green}Фронтенд запущено! Натисніть Ctrl+C для зупинки.${colors.reset}`);
    
    child.on('close', (code) => {
      if (code !== null) {
        console.log(`\n${colors.yellow}Фронтенд зупинено. Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
        
        rl.once('line', () => {
          showMainMenu();
        });
      }
    });
  } catch (error) {
    console.error(`${colors.red}Помилка при запуску frontend: ${error.message}${colors.reset}`);
    
    console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
    
    rl.once('line', () => {
      showMainMenu();
    });
  }
}

/**
 * Перевірка вимог системи
 */
async function checkRequirements() {
  let allRequirementsMet = true;

  console.log(`\n${colors.bright}${colors.yellow}=== Перевірка вимог системи ===${colors.reset}\n`);
  
  // Перевірка наявності Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`${colors.green}✅ Node.js: ${nodeVersion}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Node.js не встановлено!${colors.reset}`);
    allRequirementsMet = false;
  }
  
  // Перевірка Docker та Docker Compose
  if (checkDocker()) {
    console.log(`${colors.green}✅ Docker встановлено${colors.reset}`);
    
    if (checkDockerCompose()) {
      console.log(`${colors.green}✅ Docker Compose встановлено${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️ Docker Compose не встановлено. Деякі функції будуть недоступні.${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⚠️ Docker не встановлено. Деякі функції будуть недоступні.${colors.reset}`);
  }
  
  // Перевірка наявності директорій проекту
  if (fs.existsSync(frontendDir)) {
    console.log(`${colors.green}✅ Frontend директорія знайдена${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Frontend директорія відсутня!${colors.reset}`);
    allRequirementsMet = false;
  }
  
  if (fs.existsSync(backendDir)) {
    console.log(`${colors.green}✅ Backend директорія знайдена${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Backend директорія відсутня!${colors.reset}`);
    allRequirementsMet = false;
  }
  
  if (!allRequirementsMet) {
    console.log(`\n${colors.yellow}⚠️ Деякі вимоги не виконані. Проект може працювати неправильно.${colors.reset}`);
    
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter, щоб продовжити...${colors.reset}`, resolve);
    });
  }
  
  return allRequirementsMet;
}

/**
 * Запуск всіх компонентів локально (frontend + backend)
 */
function startLocal() {
  console.log(`${colors.cyan}Запуск frontend та backend локально...${colors.reset}`);
  
  try {
    // Запускаємо backend
    console.log(`${colors.blue}Запуск backend...${colors.reset}`);
    const backendChild = spawn('npm', ['run', 'dev'], { 
      cwd: backendDir,
      stdio: 'inherit',
      detached: true,
      shell: true
    });
    
    // Зачекаємо трохи, щоб backend встиг запуститися
    setTimeout(() => {
      console.log(`${colors.blue}Запуск frontend...${colors.reset}`);
      const frontendChild = spawn('npm', ['run', 'dev'], { 
        cwd: frontendDir,
        stdio: 'inherit',
        shell: true
      });
      
      console.log(`${colors.green}Проект запущено локально!${colors.reset}`);
      console.log(`${colors.green}Натисніть Ctrl+C для зупинки всіх процесів.${colors.reset}`);
      
      frontendChild.on('close', (code) => {
        if (code !== null) {
          console.log(`\n${colors.yellow}Frontend зупинено.${colors.reset}`);
          // Зупиняємо і backend при виході
          try {
            process.kill(-backendChild.pid, 'SIGINT');
          } catch (e) {
            // Ігноруємо помилку, якщо процес вже зупинено
          }
          
          console.log(`${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
          rl.once('line', () => {
            showMainMenu();
          });
        }
      });
      
    }, 2000);
  } catch (error) {
    console.error(`${colors.red}Помилка при запуску проекту: ${error.message}${colors.reset}`);
    console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
    
    rl.once('line', () => {
      showMainMenu();
    });
  }
}

/**
 * Показує статус запущених контейнерів
 */
function showContainerStatus() {
  console.log(`${colors.yellow}Перевірка статусу контейнерів...${colors.reset}`);
  
  try {
    console.log(`\n${colors.cyan}Docker контейнери:${colors.reset}`);
    execSync('docker ps --filter "name=monobank-donate" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', { stdio: 'inherit' });
  } catch (error) {
    console.error(`${colors.red}Помилка при перевірці статусу Docker контейнерів: ${error.message}${colors.reset}`);
  }
  
  console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
  
  rl.once('line', () => {
    showMainMenu();
  });
}

/**
 * Налаштування Docker параметрів
 */
async function configureDockerSettings() {
  console.log(`\n${colors.bright}${colors.yellow}=== Налаштування Docker-середовища ===${colors.reset}\n`);
  
  // Створюємо резервну копію перед внесенням змін
  createBackup('pre-docker-config');
  
  // Створюємо об'єкт з параметрами Docker-compose, які можна змінити
  const dockerSettings = {
    frontendPort: '80',
    backendPort: '3001',
    useVolumeForFrontend: true,
    useVolumeForBackend: true,
    additionalEnvironment: {}
  };
  
  // Читаємо існуючі налаштування з docker-compose.yml, якщо файл існує
  if (fs.existsSync('./docker-compose.yml')) {
    try {
      console.log(`${colors.cyan}Аналізуємо існуючі налаштування з docker-compose.yml...${colors.reset}`);
      const dockerComposeContent = fs.readFileSync('./docker-compose.yml', 'utf8');
      
      // Витягуємо налаштування портів
      const frontendPortMatch = dockerComposeContent.match(/frontend[\s\S]*?ports[\s\S]*?["'](\d+):80["']/);
      if (frontendPortMatch && frontendPortMatch[1]) {
        dockerSettings.frontendPort = frontendPortMatch[1];
      }
      
      const backendPortMatch = dockerComposeContent.match(/backend[\s\S]*?ports[\s\S]*?["'](\d+):3001["']/);
      if (backendPortMatch && backendPortMatch[1]) {
        dockerSettings.backendPort = backendPortMatch[1];
      }
      
      // Перевіряємо наявність volume для frontend і backend
      dockerSettings.useVolumeForFrontend = dockerComposeContent.includes('./frontend:/app/frontend-src');
      dockerSettings.useVolumeForBackend = dockerComposeContent.includes('./backend:/app/backend-src');
    } catch (error) {
      console.error(`${colors.red}Помилка при аналізі docker-compose.yml: ${error.message}${colors.reset}`);
    }
  }
  
  // Налаштування портів
  console.log(`\n${colors.cyan}Налаштування портів:${colors.reset}`);
  dockerSettings.frontendPort = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Порт для frontend (зовнішній) ${colors.bright}(${dockerSettings.frontendPort})${colors.reset}${colors.yellow}:${colors.reset} `, (answer) => {
      resolve(answer.trim() || dockerSettings.frontendPort);
    });
  });
  
  dockerSettings.backendPort = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Порт для backend (зовнішній) ${colors.bright}(${dockerSettings.backendPort})${colors.reset}${colors.yellow}:${colors.reset} `, (answer) => {
      resolve(answer.trim() || dockerSettings.backendPort);
    });
  });
  
  // Налаштування томів
  console.log(`\n${colors.cyan}Налаштування томів (для розробки):${colors.reset}`);
  dockerSettings.useVolumeForFrontend = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Використовувати том для frontend (y/n) ${colors.bright}(${dockerSettings.useVolumeForFrontend ? 'y' : 'n'})${colors.reset}${colors.yellow}:${colors.reset} `, (answer) => {
      const res = answer.trim().toLowerCase();
      if (res === 'y' || res === 'yes') {
        return resolve(true);
      } else if (res === 'n' || res === 'no') {
        return resolve(false);
      }
      resolve(dockerSettings.useVolumeForFrontend);
    });
  });
  
  dockerSettings.useVolumeForBackend = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Використовувати том для backend (y/n) ${colors.bright}(${dockerSettings.useVolumeForBackend ? 'y' : 'n'})${colors.reset}${colors.yellow}:${colors.reset} `, (answer) => {
      const res = answer.trim().toLowerCase();
      if (res === 'y' || res === 'yes') {
        return resolve(true);
      } else if (res === 'n' || res === 'no') {
        return resolve(false);
      }
      resolve(dockerSettings.useVolumeForBackend);
    });
  });
  
  // Генеруємо docker-compose файли на основі налаштувань
  await generateDockerComposeFiles(dockerSettings);
  
  console.log(`\n${colors.green}Налаштування Docker завершено!${colors.reset}`);
  console.log(`${colors.green}Файли docker-compose.yml та docker-compose.dev.yml оновлено.${colors.reset}`);
  
  await new Promise(resolve => {
    rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
  });
  
  showMainMenu();
}

/**
 * Генерує файли docker-compose.yml та docker-compose.dev.yml на основі налаштувань
 */
async function generateDockerComposeFiles(settings) {
  // Спершу зчитуємо всі змінні середовища з .env файлів, якщо вони існують
  const envVars = {
    frontend: {},
    backend: {}
  };
  
  try {
    // Зчитуємо змінні frontend .env
    const frontendEnvPath = path.join(frontendDir, '.env');
    if (fs.existsSync(frontendEnvPath)) {
      const frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
      frontendEnvContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
          const [key, value] = trimmedLine.split('=', 2);
          if (key) envVars.frontend[key.trim()] = value.trim();
        }
      });
    }
    
    // Зчитуємо змінні backend .env
    const backendEnvPath = path.join(backendDir, '.env');
    if (fs.existsSync(backendEnvPath)) {
      const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
      backendEnvContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
          const [key, value] = trimmedLine.split('=', 2);
          if (key) envVars.backend[key.trim()] = value.trim();
        }
      });
    }
  } catch (error) {
    console.error(`${colors.red}Помилка при зчитуванні .env файлів: ${error.message}${colors.reset}`);
  }
  
  console.log(`${colors.cyan}Налаштування змінних середовища для Docker...${colors.reset}`);
  
  // Формуємо змінні середовища для docker-compose в форматі yaml
  let frontendEnvConfig = `      - NODE_ENV=production\n`;
  let backendEnvConfig = `      - NODE_ENV=production\n`;
  let backendDevEnvConfig = `      - NODE_ENV=development\n`;
  
  // Додаємо ALLOWED_ORIGINS для backend, який містить frontendPort
  backendEnvConfig += `      - ALLOWED_ORIGINS=http://localhost,http://localhost:${settings.frontendPort}\n`;
  backendDevEnvConfig += `      - ALLOWED_ORIGINS=http://localhost,http://localhost:${settings.frontendPort},http://frontend,http://frontend:80\n`;
  
  // Підготовка змінних Vite як аргументів збірки для frontend
  // Ці змінні потрібно передати на етапі збірки, а не тільки як змінні середовища
  let frontendBuildArgs = `        - VITE_API_URL=http://localhost:${settings.backendPort}/api/parse-monobank`;
  let frontendProdBuildArgs = `        - VITE_API_URL=http://localhost:${settings.backendPort}/api/parse-monobank`;
  
  // Змінні середовища НЕ Vite для frontend
  let frontendNonViteEnvVars = '';
  
  // Додаємо решту змінних з .env файлів
  if (Object.keys(envVars.frontend).length > 0) {
    console.log(`${colors.green}Додаємо ${Object.keys(envVars.frontend).length} змінних frontend до Docker конфігурації${colors.reset}`);
    
    const frontendEnvVarsToIgnore = ['NODE_ENV']; // Змінні, які вже додані або не потрібні
    
    for (const [key, value] of Object.entries(envVars.frontend)) {
      if (!frontendEnvVarsToIgnore.includes(key)) {
        // Якщо це Vite змінна, додаємо її як аргумент збірки
        if (key.startsWith('VITE_') && key !== 'VITE_API_URL') {
          frontendBuildArgs += `\n        - ${key}=${value}`;
          frontendProdBuildArgs += `\n        - ${key}=${value}`;
        } else {
          // Інші змінні додаємо як звичайні змінні середовища
          frontendNonViteEnvVars += `      - ${key}=${value}\n`;
        }
        
        // Також додаємо всі змінні до списку змінних середовища
        frontendEnvConfig += `      - ${key}=${value}\n`;
      }
    }
  }
  
  if (Object.keys(envVars.backend).length > 0) {
    console.log(`${colors.green}Додаємо ${Object.keys(envVars.backend).length} змінних backend до Docker конфігурації${colors.reset}`);
    
    const backendEnvVarsToIgnore = ['NODE_ENV', 'ALLOWED_ORIGINS']; // Змінні, які вже додані
    
    for (const [key, value] of Object.entries(envVars.backend)) {
      if (!backendEnvVarsToIgnore.includes(key)) {
        backendEnvConfig += `      - ${key}=${value}\n`;
        backendDevEnvConfig += `      - ${key}=${value}\n`;
      }
    }
  }
  
  // Генеруємо docker-compose.yml для продакшну
  const productionConfig = `services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
${frontendProdBuildArgs}
    container_name: monobank-donate-frontend
    ports:
      - "${settings.frontendPort}:80"
    depends_on:
      - backend
    networks:
      - monobank-network
    restart: unless-stopped
    environment:
${frontendEnvConfig}

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: monobank-donate-backend
    environment:
${backendEnvConfig}
    ports:
      - "${settings.backendPort}:3001"
    networks:
      - monobank-network
    restart: unless-stopped

networks:
  monobank-network:
    driver: bridge`;

  fs.writeFileSync('docker-compose.yml', productionConfig);
  console.log(`${colors.green}Файл docker-compose.yml оновлено${colors.reset}`);
  
  // Генеруємо docker-compose.dev.yml для розробки
  let devConfig = `services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
${frontendBuildArgs}
    container_name: monobank-donate-frontend
    ports:
      - "${settings.frontendPort}:80"
    depends_on:
      - backend
    networks:
      - monobank-network
    environment:
      - NODE_ENV=development`;
  
  // Додаємо змінні середовища frontend для dev-режиму
  if (frontendNonViteEnvVars !== '') {
    devConfig += `\n${frontendNonViteEnvVars}`;
  } else if (Object.keys(envVars.frontend).length > 0) {
    const frontendEnvVarsToIgnore = ['NODE_ENV']; // Змінні, які вже додані
    
    for (const [key, value] of Object.entries(envVars.frontend)) {
      if (!frontendEnvVarsToIgnore.includes(key) && !key.startsWith('VITE_')) {
        devConfig += `\n      - ${key}=${value}`;
      }
    }
  }
  
  // Додаємо том для frontend, якщо потрібно
  if (settings.useVolumeForFrontend) {
    devConfig += `
    volumes:
      - ./frontend:/app/frontend-src:ro`;
  }
  
  devConfig += `

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: monobank-donate-backend
    environment:
${backendDevEnvConfig}
    ports:
      - "${settings.backendPort}:3001"
    networks:
      - monobank-network`;
  
  // Додаємо том для backend, якщо потрібно
  if (settings.useVolumeForBackend) {
    devConfig += `
    volumes:
      - ./backend:/app/backend-src:ro`;
  }
  
  devConfig += `

networks:
  monobank-network:
    driver: bridge`;

  fs.writeFileSync('docker-compose.dev.yml', devConfig);
  console.log(`${colors.green}Файл docker-compose.dev.yml оновлено${colors.reset}`);
  
  // Виводимо додаткову інформацію про змінні Vite
  console.log(`${colors.cyan}Важливо:${colors.reset} Змінні Vite (з префіксом VITE_) передані як аргументи збірки для правильної інтеграції у фронтенд.`);
}

/**
 * Перевірка та оновлення .dockerignore файлу
 */
function checkDockerIgnore() {
  console.log(`${colors.cyan}Перевірка .dockerignore файлу...${colors.reset}`);
  
  const dockerIgnorePath = path.join(rootDir, '.dockerignore');
  const requiredIgnores = [
    'node_modules',
    '.git',
    '.github',
    '.cursor',
    '*.log',
    '.env',
    '.env.*',
    'backups'
  ];
  
  // Стандартний вміст .dockerignore, якщо файл не існує
  const defaultDockerIgnoreContent = `# Стандартні директорії та файли
node_modules
.git
.github
.vscode
.idea
.cursor

# Логи
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Файли змінних середовища (змінні передаються через docker-compose)
.env
.env.*

# Бекапи та інші
backups
`;
  
  // Якщо файл не існує, створюємо його
  if (!fs.existsSync(dockerIgnorePath)) {
    console.log(`${colors.yellow}Файл .dockerignore не знайдено. Створюємо новий...${colors.reset}`);
    try {
      fs.writeFileSync(dockerIgnorePath, defaultDockerIgnoreContent, 'utf8');
      console.log(`${colors.green}Створено .dockerignore файл з налаштуваннями за замовчуванням${colors.reset}`);
      return true;
    } catch (error) {
      console.error(`${colors.red}Помилка при створенні .dockerignore файлу: ${error.message}${colors.reset}`);
      return false;
    }
  }
  
  // Перевірка існуючого файлу
  try {
    const currentContent = fs.readFileSync(dockerIgnorePath, 'utf8');
    let needsUpdate = false;
    
    // Перевіряємо наявність всіх необхідних правил
    for (const rule of requiredIgnores) {
      if (!currentContent.includes(rule)) {
        needsUpdate = true;
        break;
      }
    }
    
    if (needsUpdate) {
      return new Promise((resolve) => {
        console.log(`${colors.yellow}Знайдено .dockerignore файл, але він не містить всіх необхідних правил.${colors.reset}`);
        rl.question(`${colors.yellow}Бажаєте оновити його? (y/n) ${colors.reset}`, async (answer) => {
          if (answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes') {
            fs.writeFileSync(dockerIgnorePath, defaultDockerIgnoreContent, 'utf8');
            console.log(`${colors.green}.dockerignore файл оновлено.${colors.reset}`);
            resolve(true);
          } else {
            console.log(`${colors.yellow}Залишаємо .dockerignore без змін.${colors.reset}`);
            resolve(false);
          }
        });
      });
    } else {
      console.log(`${colors.green}.dockerignore файл вже містить всі необхідні правила.${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.error(`${colors.red}Помилка при перевірці .dockerignore файлу: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Повне налаштування проекту за один крок
 */
async function configureAll() {
  console.log(`\n${colors.bright}${colors.yellow}=== Повне налаштування проекту ===${colors.reset}\n`);
  
  console.log(`${colors.cyan}Цей майстер проведе вас через процес налаштування всього проекту.${colors.reset}`);
  console.log(`${colors.cyan}Спочатку ми налаштуємо змінні середовища, а потім параметри Docker.${colors.reset}`);
  
  // Створюємо резервну копію перед початком
  createBackup('pre-full-config');
  
  // Крок 1: Налаштування .env файлів
  console.log(`\n${colors.bright}${colors.cyan}Крок 1: Налаштування змінних середовища (.env файли)${colors.reset}\n`);
  
  // Перевірка та створення файлів .env
  const frontendEnvExists = createEnvFile(frontendDir);
  const backendEnvExists = createEnvFile(backendDir);
  
  // Запит основних параметрів для frontend
  console.log(`\n${colors.bright}${colors.cyan}Frontend .env налаштування:${colors.reset}`);
  const frontendEnvPath = path.join(frontendDir, '.env');
  
  // Налаштування frontend
  const jarUrl = await askAndSetValue(
    'Введіть URL банки Monobank',
    'https://send.monobank.ua/jar/58vdbegH3T',
    frontendEnvPath,
    'VITE_MONOBANK_JAR_URL'
  );
  
  await askAndSetValue(
    'Інтервал оновлення даних (мс)',
    '15000',
    frontendEnvPath,
    'VITE_UPDATE_INTERVAL'
  );
  
  // Налаштування порогів сповіщень
  console.log(`\n${colors.cyan}Налаштування порогів сповіщень:${colors.reset}`);
  
  await askAndSetValue(
    'Поріг для сповіщень: відсоток від цільової суми (%)',
    '2',
    frontendEnvPath,
    'VITE_NOTIFICATION_THRESHOLD_TARGET_PERCENT'
  );
  
  await askAndSetValue(
    'Поріг для сповіщень: відсоток від поточної суми (%)',
    '5',
    frontendEnvPath,
    'VITE_NOTIFICATION_THRESHOLD_CURRENT_PERCENT'
  );
  
  await askAndSetValue(
    'Поріг для сповіщень: абсолютне значення (грн)',
    '1000',
    frontendEnvPath,
    'VITE_NOTIFICATION_THRESHOLD_ABSOLUTE'
  );
  
  // Налаштування backend
  console.log(`\n${colors.bright}${colors.cyan}Backend .env налаштування:${colors.reset}`);
  const backendEnvPath = path.join(backendDir, '.env');
  
  await askAndSetValue(
    'URL банки Monobank за замовчуванням',
    jarUrl, // Використовуємо той самий URL, що і для frontend
    backendEnvPath,
    'DEFAULT_JAR_URL'
  );
  
  await askAndSetValue(
    'Час життя кешу (секунди)',
    '15',
    backendEnvPath,
    'CACHE_TTL'
  );
  
  // Крок 2: Налаштування Docker
  console.log(`\n${colors.bright}${colors.cyan}Крок 2: Налаштування Docker${colors.reset}\n`);
  
  // Створюємо об'єкт з параметрами Docker
  const dockerSettings = {
    frontendPort: '80',
    backendPort: '3001',
    useVolumeForFrontend: true,
    useVolumeForBackend: true
  };
  
  // Порти
  dockerSettings.frontendPort = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Порт для frontend (зовнішній) ${colors.bright}(${dockerSettings.frontendPort})${colors.reset}${colors.yellow}:${colors.reset} `, (answer) => {
      resolve(answer.trim() || dockerSettings.frontendPort);
    });
  });
  
  dockerSettings.backendPort = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Порт для backend (зовнішній) ${colors.bright}(${dockerSettings.backendPort})${colors.reset}${colors.yellow}:${colors.reset} `, (answer) => {
      resolve(answer.trim() || dockerSettings.backendPort);
    });
  });
  
  // Оновлюємо ALLOWED_ORIGINS з урахуванням портів
  await askAndSetValue(
    'Дозволені джерела для CORS (через кому)',
    `http://localhost:5173,http://localhost,http://localhost:${dockerSettings.frontendPort}`,
    backendEnvPath,
    'ALLOWED_ORIGINS'
  );
  
  // Крок 3: Перевірка .dockerignore
  console.log(`\n${colors.bright}${colors.cyan}Крок 3: Перевірка .dockerignore${colors.reset}\n`);
  await checkDockerIgnore();
  
  // Крок 4: Генерація Docker-compose файлів
  console.log(`\n${colors.bright}${colors.cyan}Крок 4: Генерація Docker-compose файлів${colors.reset}\n`);
  await generateDockerComposeFiles(dockerSettings);
  
  console.log(`\n${colors.green}Повне налаштування проекту завершено!${colors.reset}`);
  console.log(`${colors.green}Проект готовий до запуску.${colors.reset}`);
  
  // Запитуємо, чи хоче користувач запустити проект
  const startProject = await new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Бажаєте запустити проект зараз? (y/n) ${colors.reset}`, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
  
  if (startProject) {
    console.log(`${colors.yellow}Як ви хочете запустити проект?${colors.reset}`);
    console.log(`${colors.green}1.${colors.reset} Через Docker (розробка)`);
    console.log(`${colors.green}2.${colors.reset} Через Docker (продакшн)`);
    console.log(`${colors.green}3.${colors.reset} Локально (frontend + backend)`);
    console.log(`${colors.green}4.${colors.reset} Повернутися до головного меню`);
    
    const startChoice = await new Promise((resolve) => {
      rl.question(`\n${colors.yellow}Ваш вибір (1-4): ${colors.reset}`, (answer) => {
        resolve(answer.trim());
      });
    });
    
    switch (startChoice) {
      case '1':
        startDevelopment();
        break;
      case '2':
        startProduction();
        break;
      case '3':
        startLocal();
        break;
      default:
        showMainMenu();
        break;
    }
  } else {
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
  }
}

/**
 * Відображення головного меню
 */
function showMainMenu() {
  console.clear();
  console.log(`\n${colors.yellow}=== Monobank Donate - Керування проектом ===${colors.reset}\n`);
  console.log(`${colors.magenta}Оберіть дію:${colors.reset}`);
  
  // Секція налаштування
  console.log(`\n${colors.cyan}Налаштування:${colors.reset}`);
  console.log(`${colors.green}1.${colors.reset} Початкове налаштування проекту`);
  console.log(`${colors.green}2.${colors.reset} Налаштувати ВСЕ (середовище + Docker)`);
  console.log(`${colors.green}3.${colors.reset} Налаштувати змінні середовища`);
  console.log(`${colors.green}4.${colors.reset} Налаштувати Docker параметри`);
  console.log(`${colors.green}5.${colors.reset} Перевірити та оновити .dockerignore`);
  console.log(`${colors.green}6.${colors.reset} Відновити з резервної копії`);
  
  // Секція Docker
  console.log(`\n${colors.cyan}Docker:${colors.reset}`);
  console.log(`${colors.green}7.${colors.reset} Запустити проект через Docker (розробка)`);
  console.log(`${colors.green}8.${colors.reset} Запустити проект через Docker (продакшн)`);
  console.log(`${colors.green}9.${colors.reset} Зупинити Docker контейнери`);
  console.log(`${colors.green}10.${colors.reset} Показати статус Docker контейнерів`);
  console.log(`${colors.green}11.${colors.reset} Показати логи Docker контейнерів`);
  console.log(`${colors.green}12.${colors.reset} Перебудувати Docker контейнери`);
  
  // Звичайний запуск
  console.log(`\n${colors.cyan}Локальний запуск:${colors.reset}`);
  console.log(`${colors.green}13.${colors.reset} Запустити все локально (frontend + backend)`);
  console.log(`${colors.green}14.${colors.reset} Запустити backend локально`);
  console.log(`${colors.green}15.${colors.reset} Запустити frontend локально`);
  
  console.log(`\n${colors.green}0.${colors.reset} Вийти\n`);
  
  rl.question(`${colors.yellow}Ваш вибір (0-15): ${colors.reset}`, handleMenuChoice);
}

/**
 * Обробник вибору пункту меню
 */
function handleMenuChoice(choice) {
  switch (choice) {
    // Налаштування
    case '1': 
      initialSetup();
      break;
    case '2':
      configureAll();
      break;
    case '3': 
      configureEnvFiles();
      break;
    case '4':
      configureDockerSettings();
      break;
    case '5':
      checkDockerIgnore().then(() => {
        rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, () => {
          showMainMenu();
        });
      });
      break;
    case '6':
      restoreFromBackup();
      break;
    
    // Docker
    case '7': 
      startDevelopment();
      break;
    case '8': 
      startProduction();
      break;
    case '9': 
      stopContainers();
      break;
    case '10':
      showContainerStatus();
      break;
    case '11': 
      showLogs();
      break;
    case '12': 
      rebuildProject();
      break;
    
    // Локальний запуск
    case '13':
      startLocal();
      break;
    case '14': 
      startBackend();
      break;
    case '15': 
      startFrontend();
      break;
    
    case '0':
      console.log(`${colors.green}Дякую за використання! До побачення.${colors.reset}`);
      rl.close();
      break;
    default:
      console.log(`${colors.red}Невідомий вибір. Спробуйте ще раз.${colors.reset}`);
      setTimeout(showMainMenu, 1500);
  }
}

// Початок виконання скрипту
console.log(`${colors.bright}${colors.green}Monobank Donate - Центральний скрипт керування проектом${colors.reset}`);
checkRequirements().then(() => {
  showMainMenu();
});

// Обробка завершення роботи
process.on('SIGINT', () => {
  console.log(`\n${colors.green}Дякую за використання! До побачення.${colors.reset}`);
  rl.close();
  process.exit(0);
}); 