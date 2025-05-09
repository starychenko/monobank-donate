/**
 * Модуль для запуску backend локально
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { colors, log } = require('../utils/colors');
const { backendDir, checkSslCertificates } = require('../utils/command-runner');
const { waitForEnter } = require('../ui/prompts');
const { checkBackendDependencies } = require('../utils/dependency-checker');
const { checkEnvFiles } = require('../config/env-manager');
const { parseEnvFile } = require('../utils/fs-helpers');

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
  
  // Перевіряємо налаштування HTTPS
  const envFilePath = path.join(backendDir, '.env');
  const envVars = parseEnvFile(envFilePath);
  const useHttps = envVars.USE_HTTPS === 'true';
  const domain = envVars.DOMAIN || 'localhost';
  
  try {
    // Модифікуємо змінні середовища для включення HTTPS, якщо потрібно
    const env = { ...process.env };
    
    if (useHttps) {
      log.info('Виявлено налаштування HTTPS...');
      
      const sslCheck = checkSslCertificates();
      if (!sslCheck.exists) {
        log.warning(sslCheck.message);
        log.warning('Бекенд буде запущено без HTTPS.');
        
        // Вимикаємо HTTPS, якщо немає сертифікатів
        env.USE_HTTPS = 'false';
      } else {
        log.success('Знайдено SSL-сертифікати. Використовуємо HTTPS.');
        env.USE_HTTPS = 'true';
        env.SSL_KEY_PATH = sslCheck.keyPath;
        env.SSL_CERT_PATH = sslCheck.certPath;
        env.DOMAIN = domain;
      }
    }
    
    // Запускаємо в режимі розробки
    const child = spawn('npm', ['run', 'dev'], { 
      cwd: backendDir,
      stdio: 'inherit',
      shell: true,
      env
    });
    
    const protocol = (useHttps && checkSslCertificates().exists) ? 'https' : 'http';
    log.success(`Бекенд запущено! Доступний за адресою: ${protocol}://${domain}:3001`);
    log.info('Натисніть Ctrl+C для зупинки.');
    
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