/**
 * Модуль для запуску backend локально
 */

const { spawn } = require('child_process');
const { colors, log } = require('../utils/colors');
const { backendDir } = require('../utils/command-runner');
const { waitForEnter } = require('../ui/prompts');
const { checkBackendDependencies } = require('../utils/dependency-checker');
const { checkEnvFiles } = require('../config/env-manager');

/**
 * Запускає backend локально
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function startBackend(rl, showMainMenu) {
  log.info('Запуск backend...');
  
  // Перевіряємо наявність залежностей перед запуском
  if (!checkBackendDependencies()) {
    log.error('Не вдалося запустити backend через помилку з залежностями.');
    log.warning('Спробуйте встановити залежності вручну:');
    log.warning(`cd backend && npm install`);
    
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Перевіряємо наявність env-файлів
  if (!checkEnvFiles('backend')) {
    log.error('Не вдалося запустити backend через відсутність або неповні налаштування в .env файлі.');
    log.warning('Будь ласка, налаштуйте змінні середовища, вибравши пункт 3 в головному меню.');
    
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  try {
    const child = spawn('npm', ['run', 'dev'], { 
      cwd: backendDir,
      stdio: 'inherit',
      shell: true
    });
    
    log.success('Бекенд запущено! Натисніть Ctrl+C для зупинки.');
    
    child.on('close', (code) => {
      if (code !== null) {
        log.warning('\nБекенд зупинено. Натисніть Enter, щоб повернутися до меню...');
        
        waitForEnter().then(() => {
          showMainMenu();
        });
      }
    });
  } catch (error) {
    log.error(`Помилка при запуску backend: ${error.message}`);
    
    await waitForEnter();
    showMainMenu();
  }
}

module.exports = {
  startBackend
}; 