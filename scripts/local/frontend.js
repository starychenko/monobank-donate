/**
 * Модуль для запуску frontend локально
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { colors, log } = require('../utils/colors');
const { frontendDir, checkSslCertificates } = require('../utils/command-runner');
const { waitForEnter, askYesNo } = require('../ui/prompts');
const { checkFrontendDependencies } = require('../utils/dependency-checker');
const { checkEnvFiles } = require('../config/env-manager');
const { parseEnvFile } = require('../utils/fs-helpers');

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
  
  // Перевіряємо налаштування HTTPS
  const envFilePath = path.join(frontendDir, '.env');
  const envVars = parseEnvFile(envFilePath);
  const useHttps = envVars.VITE_USE_HTTPS === 'true';
  
  try {
    let npmCommand = 'run dev';
    
    // Якщо використовується HTTPS, перевіряємо наявність сертифікатів
    if (useHttps) {
      log.info('Виявлено налаштування HTTPS...');
      
      const sslCheck = checkSslCertificates();
      if (!sslCheck.exists) {
        log.warning(sslCheck.message);
        log.warning('Фронтенд буде запущено без HTTPS.');
      } else {
        log.success('Знайдено SSL-сертифікати. Використовуємо HTTPS.');
        
        // HTTPS configuration is handled by Vite config
        log.info('Запуск з підтримкою HTTPS через Vite...');
      }
    }
    
    const child = spawn('npm', npmCommand.split(' '), { 
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true
    });
    
    const protocol = useHttps ? 'https' : 'http';
    const domain = envVars.VITE_DOMAIN || 'localhost';
    log.success(`Фронтенд запущено! Доступний за адресою: ${protocol}://${domain}:5173`);
    log.info('Натисніть Ctrl+C для зупинки.');
    
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