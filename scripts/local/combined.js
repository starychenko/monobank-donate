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
const { execSync } = require('child_process');

/**
 * Перевіряє, чи порт вільний
 * @param {string} port - Номер порту для перевірки
 * @returns {boolean} - true, якщо порт вільний, false - якщо зайнятий
 */
function isPortAvailable(port) {
  try {
    // Використовуємо більш надійний спосіб перевірки для Windows
    if (process.platform === 'win32') {
      // Додаємо опцію -n, щоб показати числові адреси замість імен для уникнення проблем з перекладом
      const result = execSync(`netstat -ano -n | findstr :${port} | findstr LISTENING`, { 
        encoding: 'utf8', 
        stdio: ['pipe', 'pipe', 'ignore'] 
      });
      
      // Якщо результат не порожній, порт зайнятий
      return result.trim() === '';
    } else {
      // Для Unix-подібних систем
      const result = execSync(`netstat -tuln | grep :${port}`, { 
        encoding: 'utf8', 
        stdio: ['pipe', 'pipe', 'ignore'] 
      });
      return result.trim() === '';
    }
  } catch (error) {
    // Якщо команда завершилась з помилкою, ймовірно порт вільний
    return true;
  }
}

/**
 * Отримує PID процесу, який використовує вказаний порт
 * @param {string} port - Номер порту
 * @returns {string|null} - PID процесу або null якщо не знайдено
 */
function getProcessUsingPort(port) {
  try {
    if (process.platform === 'win32') {
      // Використовуємо більш надійний підхід з опцією -n для числових адрес
      const result = execSync(`netstat -ano -n | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
      
      // Перевіряємо, чи є результат
      if (!result || result.trim() === '') {
        return null;
      }
      
      // Розбиваємо на рядки і беремо перший
      const lines = result.trim().split('\n');
      if (lines.length > 0) {
        // Шукаємо PID в останньому стовпці (числове значення)
        const pid = lines[0].trim().split(/\s+/).pop();
        return pid || null;
      }
      return null;
    } else {
      const result = execSync(`lsof -i :${port} -P -n -t`, { encoding: 'utf8' });
      return result.trim() || null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Отримує ім'я процесу за його PID
 * @param {string} pid - PID процесу
 * @returns {string} - Назва процесу
 */
function getProcessNameByPid(pid) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' });
      const match = result.match(/"([^"]+)"/);
      return match ? match[1] : 'Невідомий процес';
    } else {
      const result = execSync(`ps -p ${pid} -o comm=`, { encoding: 'utf8' });
      return result.trim() || 'Невідомий процес';
    }
  } catch (error) {
    return 'Невідомий процес';
  }
}

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
  
  // Перевіряємо, чи порти доступні
  const portsToCheck = [
    { name: 'Frontend', port: frontendPort },
    { name: 'Backend', port: backendPort }
  ];
  
  for (const { name, port } of portsToCheck) {
    if (!isPortAvailable(port)) {
      const pid = getProcessUsingPort(port);
      const processName = pid ? getProcessNameByPid(pid) : 'невідомий процес';
      
      log.error(`Порт ${port} (${name}) вже використовується процесом ${processName} (PID: ${pid}).`);
      
      const answer = await new Promise((resolve) => {
        console.log(`\n${colors.yellow}Оберіть дію:${colors.reset}`);
        console.log(`${colors.green}1.${colors.reset} Завершити процес, що блокує порт ${port}`);
        console.log(`${colors.green}2.${colors.reset} Скасувати запуск`);
        
        rl.question(`${colors.yellow}Ваш вибір (1-2): ${colors.reset}`, (answer) => {
          resolve(answer.trim());
        });
      });
      
      if (answer === '1') {
        if (!pid) {
          log.error('Неможливо визначити PID процесу, що блокує порт. Скасовую запуск.');
          await waitForEnter();
          showMainMenu();
          return;
        }
        
        try {
          if (process.platform === 'win32') {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
          } else {
            execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
          }
          log.success(`Процес з PID ${pid} успішно завершено.`);
        } catch (error) {
          log.error(`Не вдалося завершити процес: ${error.message}`);
          await waitForEnter();
          showMainMenu();
          return;
        }
      } else {
        log.warning('Запуск скасовано.');
        await waitForEnter();
        showMainMenu();
        return;
      }
    }
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