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
    execSync('docker-compose --version', { stdio: 'ignore' });
    return true;
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
      log.success('✅ Docker Compose встановлено');
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
  checkDocker,
  checkDockerCompose,
  checkRequirements,
  rootDir,
  frontendDir,
  backendDir
}; 