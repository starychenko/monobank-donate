#!/usr/bin/env node

/**
 * Скрипт для автоматизованого налаштування робочого середовища проекту Monobank Donate
 * - Встановлює залежності у папках frontend та backend
 * - Створює .env файли з .env.example
 * - Допомагає налаштувати ключові параметри
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
  magenta: '\x1b[35m'
};

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
  const content = `# URL API
VITE_API_URL=http://localhost:3001/api/parse-monobank

# URL збору Monobank
VITE_MONOBANK_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Інтервал оновлення в мс (15 секунд)
VITE_UPDATE_INTERVAL=15000`;

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
  const content = `# Порт сервера
PORT=3001

# URL банки за замовчуванням
DEFAULT_JAR_URL=https://send.monobank.ua/jar/YOUR_JAR_ID

# Кешування
CACHE_TTL=15

# Безпека
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

# Режим для розробки
NODE_ENV=development`;

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
      resolve();
    });
  });
}

/**
 * Налаштовує ключові параметри в .env файлах
 */
async function configureEnvFiles() {
  console.log(`\n${colors.bright}${colors.magenta}=== Налаштування ключових параметрів ===${colors.reset}\n`);
  
  const backendEnvPath = path.join(backendDir, '.env');
  const frontendEnvPath = path.join(frontendDir, '.env');
  
  // Запитуємо ID банки Monobank
  const jarQuestion = 'Введіть ID банки Monobank (частина URL після "jar/")';
  let jarId = 'YOUR_JAR_ID';
  
  await new Promise((resolve) => {
    rl.question(`${colors.yellow}${jarQuestion}:${colors.reset} `, (answer) => {
      if (answer.trim()) {
        jarId = answer.trim();
        console.log(`${colors.green}ID банки встановлено: ${jarId}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}Використовуємо значення за замовчуванням: ${jarId}${colors.reset}`);
      }
      resolve();
    });
  });
  
  // Оновлюємо ID банки в обох .env файлах
  updateEnvValue(backendEnvPath, 'DEFAULT_JAR_URL', `https://send.monobank.ua/jar/${jarId}`);
  updateEnvValue(frontendEnvPath, 'VITE_MONOBANK_JAR_URL', `https://send.monobank.ua/jar/${jarId}`);
  
  // Налаштування інших параметрів бекенду
  await askAndSetValue('Порт сервера', '3001', backendEnvPath, 'PORT');
  await askAndSetValue('Час життя кешу в секундах', '15', backendEnvPath, 'CACHE_TTL');
  
  // Налаштування інших параметрів фронтенду
  const backendPort = fs.readFileSync(backendEnvPath, 'utf8')
    .split('\n')
    .find(line => line.startsWith('PORT='))
    ?.split('=')[1] || '3001';
    
  const defaultApiUrl = `http://localhost:${backendPort}/api/parse-monobank`;
  await askAndSetValue('URL API бекенду', defaultApiUrl, frontendEnvPath, 'VITE_API_URL');
  await askAndSetValue('Інтервал оновлення в мс', '15000', frontendEnvPath, 'VITE_UPDATE_INTERVAL');
  
  console.log(`\n${colors.green}✓ Налаштування параметрів завершено${colors.reset}`);
}

/**
 * Виводить інструкції після завершення
 */
function showCompletionInstructions() {
  console.log(`
${colors.bright}${colors.green}=== Налаштування завершено ===${colors.reset}

${colors.bright}Наступні кроки:${colors.reset}
1. Запустіть backend: ${colors.cyan}cd backend && npm run dev${colors.reset}
2. В іншому терміналі запустіть frontend: ${colors.cyan}cd frontend && npm run dev${colors.reset}

${colors.yellow}Параметри в .env файлах можна змінити вручну у будь-який час.${colors.reset}
`);
}

/**
 * Запускає серверну частину проекту
 */
function startBackend() {
  console.log(`\n${colors.bright}${colors.cyan}=== Запуск Backend ====${colors.reset}\n`);
  runCommand('start cmd.exe /k "cd backend && npm run dev"', rootDir);
}

/**
 * Запускає клієнтську частину проекту
 */
function startFrontend() {
  console.log(`\n${colors.bright}${colors.cyan}=== Запуск Frontend ====${colors.reset}\n`);
  runCommand('start cmd.exe /k "cd frontend && npm run dev"', rootDir);
}

/**
 * Головна функція налаштування
 */
async function setup() {
  console.log(`\n${colors.bright}${colors.cyan}=== Налаштування проекту Monobank Donate ===${colors.reset}\n`);

  // Перевірка наявності директорій
  if (!fs.existsSync(frontendDir) || !fs.existsSync(backendDir)) {
    console.error(`${colors.red}Помилка: Не знайдено папки frontend або backend${colors.reset}`);
    process.exit(1);
  }

  // Запитуємо користувача про встановлення залежностей
  const installDeps = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Встановити npm залежності? (Y/n):${colors.reset} `, (answer) => {
      resolve(answer.toLowerCase() !== 'n');
    });
  });
  
  if (installDeps) {
    console.log(`\n${colors.bright}Встановлення залежностей backend...${colors.reset}`);
    runCommand('npm install', backendDir);
    
    console.log(`\n${colors.bright}Встановлення залежностей frontend...${colors.reset}`);
    runCommand('npm install', frontendDir);
  }
  
  console.log(`\n${colors.bright}Створення .env файлів...${colors.reset}`);
  const backendEnvCreated = createEnvFile(backendDir);
  const frontendEnvCreated = createEnvFile(frontendDir);
  
  // Якщо файли .env успішно створені, пропонуємо налаштувати їх
  if (backendEnvCreated && frontendEnvCreated) {
    const configureEnv = await new Promise((resolve) => {
      rl.question(`\n${colors.yellow}Налаштувати параметри в .env файлах? (Y/n):${colors.reset} `, (answer) => {
        resolve(answer.toLowerCase() !== 'n');
      });
    });
    
    if (configureEnv) {
      await configureEnvFiles();
    }
  }
  
  showCompletionInstructions();
  
  // Пропонуємо запустити проект
  const shouldStartProject = await new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Бажаєте запустити проект зараз? (Y/n):${colors.reset} `, (answer) => {
      resolve(answer.toLowerCase() !== 'n');
    });
  });
  
  if (shouldStartProject) {
    console.log(`\n${colors.magenta}Запуск проекту...${colors.reset}`);
    startBackend();
    
    // Даємо бекенду час на запуск перед запуском фронтенду
    setTimeout(() => {
      startFrontend();
      console.log(`\n${colors.green}✓ Проект запущено!${colors.reset}`);
      console.log(`${colors.yellow}Примітка: Ви можете відкрити frontend за адресою http://localhost:5173${colors.reset}`);
      rl.close();
    }, 3000);
  } else {
    rl.close();
  }
}

// Запускаємо процес налаштування
setup().catch(error => {
  console.error(`${colors.red}Помилка при налаштуванні:${colors.reset}`, error);
  process.exit(1);
}); 