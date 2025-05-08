/**
 * Модуль для запуску frontend локально
 */

const { spawn } = require('child_process');
const { colors, log } = require('../utils/colors');
const { frontendDir } = require('../utils/command-runner');
const { waitForEnter } = require('../ui/prompts');
const { checkFrontendDependencies } = require('../utils/dependency-checker');
const { checkEnvFiles } = require('../config/env-manager');

/**
 * Запускає frontend локально
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function startFrontend(rl, showMainMenu) {
  log.info('Запуск frontend...');
  
  // Перевіряємо наявність залежностей перед запуском
  if (!checkFrontendDependencies()) {
    log.error('Не вдалося запустити frontend через помилку з залежностями.');
    log.warning('Спробуйте встановити залежності вручну:');
    log.warning(`cd frontend && npm install`);
    
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Перевіряємо наявність env-файлів
  if (!checkEnvFiles('frontend')) {
    log.error('Не вдалося запустити frontend через відсутність або неповні налаштування в .env файлі.');
    log.warning('Будь ласка, налаштуйте змінні середовища, вибравши пункт 3 в головному меню.');
    
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  try {
    const child = spawn('npm', ['run', 'dev'], { 
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true
    });
    
    log.success('Фронтенд запущено! Натисніть Ctrl+C для зупинки.');
    
    child.on('close', (code) => {
      if (code !== null) {
        log.warning('\nФронтенд зупинено. Натисніть Enter, щоб повернутися до меню...');
        
        waitForEnter().then(() => {
          showMainMenu();
        });
      }
    });
  } catch (error) {
    log.error(`Помилка при запуску frontend: ${error.message}`);
    
    await waitForEnter();
    showMainMenu();
  }
}

module.exports = {
  startFrontend
}; 