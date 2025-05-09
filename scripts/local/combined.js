/**
 * Модуль для запуску frontend та backend разом локально
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { colors, log } = require('../utils/colors');
const { frontendDir, backendDir, checkSslCertificates } = require('../utils/command-runner');
const { waitForEnter } = require('../ui/prompts');
const { checkFrontendDependencies, checkBackendDependencies } = require('../utils/dependency-checker');
const { checkEnvFiles } = require('../config/env-manager');
const { parseEnvFile } = require('../utils/fs-helpers');
const { 
  isPortAvailable, 
  isPortAvailableAsync, 
  getProcessUsingPort, 
  getProcessNameByPid,
  checkPortsAvailability
} = require('../docker/container-manager');

/**
 * Запускає frontend та backend локально
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function startLocal(rl, showMainMenu) {
  log.info('Запуск frontend та backend локально...');
  
  // Перевіряємо наявність залежностей перед запуском
  const backendDepsOk = checkBackendDependencies();
  const frontendDepsOk = checkFrontendDependencies();
  
  if (!backendDepsOk || !frontendDepsOk) {
    log.error('Не вдалося запустити проект через помилку з залежностями.');
    
    if (!backendDepsOk) {
      log.warning('Спробуйте встановити залежності backend вручну:');
      log.warning(`cd backend && npm install`);
    }
    
    if (!frontendDepsOk) {
      log.warning('Спробуйте встановити залежності frontend вручну:');
      log.warning(`cd frontend && npm install`);
    }
    
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Перевіряємо наявність env-файлів
  const backendEnvOk = checkEnvFiles('backend');
  const frontendEnvOk = checkEnvFiles('frontend');
  
  if (!backendEnvOk || !frontendEnvOk) {
    log.error('Не вдалося запустити проект через неналаштовані змінні середовища.');
    
    if (!backendEnvOk) {
      log.warning('Backend .env файл відсутній або неповний.');
    }
    
    if (!frontendEnvOk) {
      log.warning('Frontend .env файл відсутній або неповний.');
    }
    
    log.warning('Будь ласка, налаштуйте змінні середовища, вибравши пункт 3 в головному меню.');
    
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Перевіряємо, чи порти доступні
  const frontendPort = "5173";
  const backendPort = "3001";
  
  // Використовуємо вдосконалену функцію перевірки портів
  const portsAvailable = await checkPortsAvailability(frontendPort, backendPort, rl);
  if (!portsAvailable) {
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Перевіряємо налаштування HTTPS
  const backendEnvPath = path.join(backendDir, '.env');
  const frontendEnvPath = path.join(frontendDir, '.env');
  const backendEnvVars = parseEnvFile(backendEnvPath);
  const frontendEnvVars = parseEnvFile(frontendEnvPath);
  
  const useHttps = backendEnvVars.USE_HTTPS === 'true' || frontendEnvVars.VITE_USE_HTTPS === 'true';
  const domain = backendEnvVars.DOMAIN || frontendEnvVars.VITE_DOMAIN || 'localhost';
  
  try {
    // Модифікуємо змінні середовища для включення HTTPS, якщо потрібно
    const env = { ...process.env };
    
    if (useHttps) {
      log.info('Виявлено налаштування HTTPS...');
      
      const sslCheck = checkSslCertificates();
      if (!sslCheck.exists) {
        log.warning(sslCheck.message);
        log.warning('Проект буде запущено без HTTPS.');
        
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
    
    // Запускаємо backend
    log.info('Запуск backend...');
    const backendChild = spawn('npm', ['run', 'dev'], { 
      cwd: backendDir,
      stdio: 'inherit',
      detached: true,
      shell: true,
      env
    });
    
    const protocol = (useHttps && checkSslCertificates().exists) ? 'https' : 'http';
    
    // Зачекаємо трохи, щоб backend встиг запуститися
    setTimeout(() => {
      log.info('Запуск frontend...');
      const frontendChild = spawn('npm', ['run', 'dev'], { 
        cwd: frontendDir,
        stdio: 'inherit',
        shell: true,
        env
      });
      
      log.success('Проект запущено локально!');
      log.success(`Frontend: ${protocol}://${domain}:5173`);
      log.success(`Backend: ${protocol}://${domain}:3001`);
      log.info('Натисніть Ctrl+C для зупинки всіх процесів.');
      
      frontendChild.on('close', (code) => {
        if (code !== null) {
          log.warning('\nFrontend зупинено.');
          // Зупиняємо і backend при виході
          try {
            process.kill(-backendChild.pid, 'SIGINT');
          } catch (e) {
            // Ігноруємо помилку, якщо процес вже зупинено
          }
          
          log.warning('Натисніть Enter, щоб повернутися до меню...');
          waitForEnter().then(() => {
            showMainMenu();
          });
        }
      });
      
    }, 2000);
  } catch (error) {
    log.error(`Помилка при запуску проекту: ${error.message}`);
    
    await waitForEnter();
    showMainMenu();
  }
}

module.exports = {
  startLocal
}; 