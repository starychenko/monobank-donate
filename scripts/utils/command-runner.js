/**
 * Утиліта для виконання команд в терміналі
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const { colors, log } = require('./colors');
const fs = require('fs');

// Директорії проекту
const rootDir = path.join(__dirname, '../..');
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');
const sslDir = path.join(rootDir, 'ssl');

// Визначення команди Docker Compose (одразу виконується при імпорті модуля)
let dockerComposeCommand = 'docker-compose';
try {
  // Спочатку перевіряємо docker compose (нова версія)
  execSync('docker compose version', { stdio: 'ignore' });
  dockerComposeCommand = 'docker compose';
} catch (error) {
  try {
    // Потім пробуємо docker-compose (стара версія)
    execSync('docker-compose --version', { stdio: 'ignore' });
    dockerComposeCommand = 'docker-compose';
  } catch (composeError) {
    console.warn(`${colors.yellow}УВАГА: Docker Compose не знайдено. Функції, пов'язані з Docker, можуть не працювати.${colors.reset}`);
  }
}

/**
 * Виконує команду у вказаній директорії
 * @param {string} command - Команда для виконання
 * @param {string} cwd - Робоча директорія
 * @returns {boolean} - Результат виконання команди
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
 * @param {string} command - Команда Docker Compose
 * @param {boolean} detached - Запускати у фоновому режимі
 * @returns {ChildProcess} - Процес Docker Compose
 */
function runDockerCompose(command, detached = false) {
  const args = command.split(' ');
  const options = detached ? ['-d'] : [];
  
  // Розбиваємо dockerComposeCommand на складові для правильного виклику
  const composeCommandParts = dockerComposeCommand.split(' ');
  const baseCommand = composeCommandParts[0]; // 'docker' або 'docker-compose'
  const restArgs = composeCommandParts.slice(1); // ['compose'] або []
  
  // Формуємо повну команду
  const fullArgs = [...restArgs, ...args, ...options];
  
  console.log(`${colors.blue}Виконую: ${colors.cyan}${dockerComposeCommand} ${args.join(' ')} ${options.join(' ')}${colors.reset}`);
  
  const child = spawn(baseCommand, fullArgs, { stdio: 'inherit' });
  
  child.on('error', (error) => {
    console.error(`${colors.red}Помилка виконання команди: ${error.message}${colors.reset}`);
    
    if (error.code === 'ENOENT') {
      console.error(`${colors.red}Команда "${baseCommand}" не знайдена. Переконайтеся, що Docker встановлений і доступний у PATH.${colors.reset}`);
    }
  });
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}Команда завершилась з кодом ${code}${colors.reset}`);
    }
  });
  
  return child;
}

/**
 * Виконує Docker Compose команду через execSync
 * @param {string} command - Команда для виконання (без префіксу "docker-compose")
 * @param {object} options - Опції для execSync
 */
function execDockerCompose(command, options = {}) {
  try {
    execSync(`${dockerComposeCommand} ${command}`, {
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    console.error(`${colors.red}Помилка виконання Docker Compose команди: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Перевіряє наявність SSL-сертифікатів
 * @returns {Object} - Результат перевірки та шляхи до сертифікатів
 */
function checkSslCertificates() {
  try {
    if (!fs.existsSync(sslDir)) {
      return { 
        exists: false, 
        message: 'Директорія SSL-сертифікатів не знайдена'
      };
    }
    
    const keyPath = path.join(sslDir, 'server.key');
    const certPath = path.join(sslDir, 'server.crt');
    
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      return { 
        exists: false, 
        message: 'SSL-сертифікати не знайдено. Спершу налаштуйте HTTPS через головне меню.'
      };
    }
    
    return {
      exists: true,
      keyPath,
      certPath
    };
  } catch (error) {
    return {
      exists: false,
      message: `Помилка при перевірці SSL-сертифікатів: ${error.message}`
    };
  }
}

/**
 * Перевірка наявності Docker
 * @returns {boolean} - Чи встановлений Docker
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
 * @returns {boolean} - Чи встановлений Docker Compose
 */
function checkDockerCompose() {
  try {
    // Спочатку перевіряємо нову версію
    try {
      execSync('docker compose version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      // Якщо нової версії немає, пробуємо стару
      execSync('docker-compose --version', { stdio: 'ignore' });
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Перевірка вимог системи
 * @returns {Promise<boolean>} - Результат перевірки
 */
async function checkRequirements() {
  let allRequirementsMet = true;

  log.title('=== Перевірка вимог системи ===');
  
  // Перевірка наявності Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log.success(`✅ Node.js: ${nodeVersion}`);
  } catch (error) {
    log.error('❌ Node.js не встановлено!');
    allRequirementsMet = false;
  }
  
  // Перевірка Docker та Docker Compose
  if (checkDocker()) {
    log.success('✅ Docker встановлено');
    
    if (checkDockerCompose()) {
      log.success(`✅ Docker Compose встановлено (використовується команда: ${dockerComposeCommand})`);
    } else {
      log.warning('⚠️ Docker Compose не встановлено. Деякі функції будуть недоступні.');
    }
  } else {
    log.warning('⚠️ Docker не встановлено. Деякі функції будуть недоступні.');
  }
  
  // Перевірка наявності директорій проекту
  if (fs.existsSync(frontendDir)) {
    log.success('✅ Frontend директорія знайдена');
  } else {
    log.error('❌ Frontend директорія відсутня!');
    allRequirementsMet = false;
  }
  
  if (fs.existsSync(backendDir)) {
    log.success('✅ Backend директорія знайдена');
  } else {
    log.error('❌ Backend директорія відсутня!');
    allRequirementsMet = false;
  }
  
  if (!allRequirementsMet) {
    log.warning('\n⚠️ Деякі вимоги не виконані. Проект може працювати неправильно.');
  }
  
  return allRequirementsMet;
}

module.exports = {
  runCommand,
  runDockerCompose,
  execDockerCompose,
  checkSslCertificates,
  checkDocker,
  checkDockerCompose,
  dockerComposeCommand,
  checkRequirements,
  rootDir,
  frontendDir,
  backendDir,
  sslDir
}; 