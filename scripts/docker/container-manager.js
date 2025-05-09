/**
 * Модуль для керування Docker контейнерами
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { colors, log } = require('../utils/colors');
const { rootDir, runDockerCompose } = require('../utils/command-runner');
const { waitForEnter } = require('../ui/prompts');
const { displayServiceUrls } = require('../ui/messages');
const { generateDockerComposeFiles } = require('./compose-generator');
const { checkEnvFiles } = require('../config/env-manager');

/**
 * Перевіряє готовність проекту до запуску через Docker
 * @returns {boolean} - Чи готовий проект до запуску
 */
function checkProjectReadiness() {
  // Перевіряємо наявність і коректність .env файлів
  if (!checkEnvFiles('all')) {
    log.error('Неможливо запустити проект через Docker: .env файли відсутні або неповні.');
    log.warning('Будь ласка, налаштуйте змінні середовища, вибравши пункт 3 в головному меню.');
    return false;
  }
  
  return true;
}

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
 * Перевіряє, чи порти доступні і пропонує рішення якщо ні
 * @param {string} frontendPort - Порт для frontend
 * @param {string} backendPort - Порт для backend
 * @param {Object} rl - Інтерфейс readline
 * @returns {Promise<boolean>} - true, якщо можна продовжувати, false - якщо слід скасувати
 */
async function checkPortsAvailability(frontendPort, backendPort, rl) {
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
        console.log(`${colors.green}2.${colors.reset} Використати інший порт`);
        console.log(`${colors.green}3.${colors.reset} Скасувати запуск`);
        
        rl.question(`${colors.yellow}Ваш вибір (1-3): ${colors.reset}`, (answer) => {
          resolve(answer.trim());
        });
      });
      
      switch (answer) {
        case '1':
          if (!pid) {
            log.error('Неможливо визначити PID процесу, що блокує порт. Спробуйте вибрати інший порт або інший варіант.');
            return await checkPortsAvailability(frontendPort, backendPort, rl);
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
            return false;
          }
          break;
        
        case '2':
          const newPort = await new Promise((resolve) => {
            rl.question(`${colors.yellow}Введіть новий порт для ${name}: ${colors.reset}`, (answer) => {
              resolve(answer.trim());
            });
          });
          
          // Оновлюємо порт в portsToCheck для подальшої перевірки
          if (name === 'Frontend') {
            portsToCheck[0].port = newPort;
            frontendPort = newPort;
          } else {
            portsToCheck[1].port = newPort;
            backendPort = newPort;
          }
          
          // Перевіряємо новий порт
          if (!isPortAvailable(newPort)) {
            log.error(`Новий порт ${newPort} також зайнятий.`);
            return await checkPortsAvailability(frontendPort, backendPort, rl);
          }
          
          // Оновлюємо docker-compose файл з новим портом
          await generateDockerComposeFiles({
            frontendPort,
            backendPort,
            useVolumeForFrontend: name === 'Frontend',
            useVolumeForBackend: name === 'Backend'
          });
          
          log.success(`Налаштовано новий порт ${newPort} для ${name}.`);
          break;
        
        case '3':
        default:
          log.warning('Запуск скасовано.');
          return false;
      }
    }
  }
  
  return true;
}

/**
 * Запуск проекту у режимі розробки через Docker
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function startDevelopment(rl, showMainMenu) {
  log.warning('Запуск проекту в режимі розробки...');
  
  // Перевіряємо готовність проекту
  if (!checkProjectReadiness()) {
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Перевіряємо наявність файлу docker-compose.dev.yml
  if (!fs.existsSync(path.join(rootDir, 'docker-compose.dev.yml'))) {
    log.warning('Файл docker-compose.dev.yml не знайдено. Створюємо...');
    
    // Використовуємо функцію для генерації docker-compose файлів
    await generateDockerComposeFiles({
      frontendPort,
      backendPort: '3001',
      useVolumeForFrontend: true,
      useVolumeForBackend: true,
      useHttps: httpsConfig.useHttps,
      domain: httpsConfig.domain,
      sslCertPath: httpsConfig.sslCertPath,
      sslKeyPath: httpsConfig.sslKeyPath
    });
  }
  
  // Перевіряємо доступність портів
  const portsAvailable = await checkPortsAvailability(frontendPort, '3001', rl);
  if (!portsAvailable) {
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Запитуємо, чи потрібно перебудувати контейнери
  const rebuildOption = await new Promise((resolve) => {
    console.log(`\n${colors.yellow}Перебудувати Docker контейнери?${colors.reset}`);
    console.log(`${colors.green}1.${colors.reset} Так, перебудувати (якщо були зміни в коді)`);
    console.log(`${colors.green}2.${colors.reset} Ні, використати існуючі образи (швидше)`);
    
    rl.question(`${colors.yellow}Ваш вибір (1-2): ${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
  
  // Визначаємо команду в залежності від вибору користувача
  let command = '-f docker-compose.dev.yml up';
  if (rebuildOption === '1') {
    command += ' --build';
  }
  
  // Запускаємо Docker Compose з dev-конфігурацією
  const child = runDockerCompose(command, true);
  
  log.success('Проект запущено у режимі розробки!');
  displayServiceUrls(frontendPort, '3001', httpsConfig.useHttps);
  
  // Якщо використовується HTTPS, виводимо додаткову інформацію
  if (httpsConfig.useHttps) {
    log.info('Використовується HTTPS з самопідписаними сертифікатами.');
    log.info('При першому відвідуванні сайту браузер покаже попередження про небезпеку.');
    log.info('Ви можете безпечно продовжити відвідування сайту, прийнявши ризик (це тестовий сервер).');
  }
  
  await waitForEnter();
  showMainMenu();
}

/**
 * Запуск проекту у продакшн режимі через Docker
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function startProduction(rl, showMainMenu) {
  log.warning('Запуск проекту в продакшн режимі...');
  
  // Перевіряємо готовність проекту
  if (!checkProjectReadiness()) {
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Перевіряємо наявність файлу docker-compose.yml
  if (!fs.existsSync(path.join(rootDir, 'docker-compose.yml'))) {
    log.warning('Файл docker-compose.yml не знайдено. Створюємо...');
    
    // Використовуємо функцію для генерації docker-compose файлів
    await generateDockerComposeFiles({
      frontendPort,
      backendPort: '3001',
      useVolumeForFrontend: false,
      useVolumeForBackend: false,
      useHttps: httpsConfig.useHttps,
      domain: httpsConfig.domain,
      sslCertPath: httpsConfig.sslCertPath,
      sslKeyPath: httpsConfig.sslKeyPath
    });
  }
  
  // Перевіряємо доступність портів
  const portsAvailable = await checkPortsAvailability(frontendPort, '3001', rl);
  if (!portsAvailable) {
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Запитуємо, чи потрібно перебудувати контейнери
  const rebuildOption = await new Promise((resolve) => {
    console.log(`\n${colors.yellow}Перебудувати Docker контейнери?${colors.reset}`);
    console.log(`${colors.green}1.${colors.reset} Так, перебудувати (якщо були зміни в коді)`);
    console.log(`${colors.green}2.${colors.reset} Ні, використати існуючі образи (швидше)`);
    
    rl.question(`${colors.yellow}Ваш вибір (1-2): ${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
  
  // Визначаємо команду в залежності від вибору користувача
  let command = 'up';
  if (rebuildOption === '1') {
    command += ' --build';
  }
  
  // Запускаємо Docker Compose з prod-конфігурацією
  const child = runDockerCompose(command, true);
  
  log.success('Проект запущено у продакшн режимі!');
  displayServiceUrls(frontendPort, '3001', httpsConfig.useHttps);
  
  // Якщо використовується HTTPS, виводимо додаткову інформацію
  if (httpsConfig.useHttps) {
    log.info('Використовується HTTPS з самопідписаними сертифікатами.');
    log.info('При першому відвідуванні сайту браузер покаже попередження про небезпеку.');
    log.info('Ви можете безпечно продовжити відвідування сайту, прийнявши ризик (це тестовий сервер).');
  }
  
  await waitForEnter();
  showMainMenu();
}

/**
 * Зупиняє Docker контейнери
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function stopContainers(rl, showMainMenu) {
  log.warning('Зупинка контейнерів...');
  
  try {
    // Перевіряємо наявність файлу docker-compose.dev.yml
    const devFileExists = fs.existsSync(path.join(rootDir, 'docker-compose.dev.yml'));
    
    if (devFileExists) {
      log.info('Зупиняємо контейнери для режиму розробки...');
      execSync('docker-compose -f docker-compose.dev.yml down', { stdio: 'inherit' });
    }
    
    // Також зупиняємо контейнери для продакшну
    log.info('Зупиняємо контейнери для продакшн режиму...');
    execSync('docker-compose down', { stdio: 'inherit' });
    
    log.success('Контейнери успішно зупинені!');
  } catch (error) {
    log.error(`Помилка при зупинці контейнерів: ${error.message}`);
  }
  
  await waitForEnter();
  showMainMenu();
}

/**
 * Показує логи Docker контейнерів
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function showLogs(rl, showMainMenu) {
  log.warning('Вибір логів для відображення:');
  console.log(`${colors.green}1.${colors.reset} Логи режиму розробки`);
  console.log(`${colors.green}2.${colors.reset} Логи продакшн режиму`);
  console.log(`${colors.green}3.${colors.reset} Повернутися до меню`);
  
  const choice = await new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Ваш вибір (1-3): ${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
  
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
      log.error('Некоректний вибір!');
      setTimeout(() => showLogs(rl, showMainMenu), 1000);
      return;
  }
  
  log.warning('Натисніть Ctrl+C, щоб зупинити відображення логів...');
  
  try {
    execSync(`docker-compose ${composeFile} logs -f`, { stdio: 'inherit' });
  } catch (error) {
    // Ігноруємо помилку, яка виникає при натисканні Ctrl+C
  }
  
  await waitForEnter();
  showMainMenu();
}

/**
 * Перебудовує проект у Docker
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function rebuildProject(rl, showMainMenu) {
  log.warning('Вибір режиму для перебудови:');
  console.log(`${colors.green}1.${colors.reset} Перебудувати режим розробки`);
  console.log(`${colors.green}2.${colors.reset} Перебудувати продакшн режим`);
  console.log(`${colors.green}3.${colors.reset} Перебудувати обидва режими`);
  console.log(`${colors.green}4.${colors.reset} Повернутися до меню`);
  
  const choice = await new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Ваш вибір (1-4): ${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
  
  switch (choice) {
    case '1':
      log.info('Перебудова контейнерів для режиму розробки...');
      execSync('docker-compose -f docker-compose.dev.yml build --no-cache', { stdio: 'inherit' });
      break;
    case '2':
      log.info('Перебудова контейнерів для продакшн режиму...');
      execSync('docker-compose build --no-cache', { stdio: 'inherit' });
      break;
    case '3':
      log.info('Перебудова контейнерів для режиму розробки...');
      execSync('docker-compose -f docker-compose.dev.yml build --no-cache', { stdio: 'inherit' });
      log.info('Перебудова контейнерів для продакшн режиму...');
      execSync('docker-compose build --no-cache', { stdio: 'inherit' });
      break;
    case '4':
      showMainMenu();
      return;
    default:
      log.error('Некоректний вибір!');
      setTimeout(() => rebuildProject(rl, showMainMenu), 1000);
      return;
  }
  
  log.success('Перебудова завершена!');
  
  await waitForEnter();
  showMainMenu();
}

/**
 * Показує статус запущених контейнерів
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function showContainerStatus(rl, showMainMenu) {
  log.warning('Перевірка статусу контейнерів...');
  
  try {
    log.info('\nDocker контейнери:');
    execSync('docker ps --filter "name=monobank-donate" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', { stdio: 'inherit' });
  } catch (error) {
    log.error(`Помилка при перевірці статусу Docker контейнерів: ${error.message}`);
  }
  
  await waitForEnter();
  showMainMenu();
}

module.exports = {
  startDevelopment,
  startProduction,
  stopContainers,
  showLogs,
  rebuildProject,
  showContainerStatus
}; 