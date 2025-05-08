#!/usr/bin/env node

/**
 * Центральний скрипт керування проектом Monobank Donate
 */

const {
  setupReadline,
  askForNumber,
  waitForEnter,
  closeReadline
} = require('./ui/prompts');

const {
  displayWelcome,
  displayGoodbye,
  displaySectionTitle,
  clearScreen,
  displaySubSectionTitle
} = require('./ui/messages');

const { 
  createBackup,
  restoreFromBackup
} = require('./backup/backup-manager');

const {
  initialSetup,
  configureAll
} = require('./config/setup');

const {
  configureEnvFiles
} = require('./config/env-manager');

const {
  checkDockerIgnore
} = require('./docker/dockerignore');

const {
  startDevelopment,
  startProduction,
  stopContainers,
  showLogs,
  rebuildProject,
  showContainerStatus
} = require('./docker/container-manager');

const {
  startFrontend
} = require('./local/frontend');

const {
  startBackend
} = require('./local/backend');

const {
  startLocal
} = require('./local/combined');

const { colors, log } = require('./utils/colors');
const { checkRequirements } = require('./utils/command-runner');

// Ініціалізуємо глобальні об'єкти
const rl = setupReadline();

// Флаг для відстеження стану роботи скрипту
let isRunning = true;

/**
 * Головне меню скрипту
 */
async function showMainMenu() {
  // Очищення консолі
  clearScreen();
  
  // Вітання
  displayWelcome();
  
  // Головне меню
  displaySectionTitle('Головне меню');
  
  // Пункти меню, згруповані за категоріями
  
  // 1. Налаштування проекту
  displaySubSectionTitle('Налаштування проекту');
  console.log(`${colors.green}1.${colors.reset} Початкове налаштування проекту`);
  console.log(`${colors.green}2.${colors.reset} Повне налаштування проекту (крок за кроком)`);
  console.log(`${colors.green}3.${colors.reset} Налаштувати змінні середовища (.env файли)`);
  console.log(`${colors.green}4.${colors.reset} Генерувати .dockerignore`);
  
  // 2. Локальний запуск
  displaySubSectionTitle('Локальний запуск');
  console.log(`${colors.green}5.${colors.reset} Запустити frontend локально`);
  console.log(`${colors.green}6.${colors.reset} Запустити backend локально`);
  console.log(`${colors.green}7.${colors.reset} Запустити frontend + backend локально`);
  
  // 3. Docker керування
  displaySubSectionTitle('Docker керування');
  console.log(`${colors.green}8.${colors.reset} Запустити через Docker (розробка)`);
  console.log(`${colors.green}9.${colors.reset} Запустити через Docker (продакшн)`);
  console.log(`${colors.green}10.${colors.reset} Зупинити Docker контейнери`);
  console.log(`${colors.green}11.${colors.reset} Статус Docker контейнерів`);
  console.log(`${colors.green}12.${colors.reset} Показати логи Docker`);
  console.log(`${colors.green}13.${colors.reset} Перебудувати Docker образи`);
  
  // 4. Резервне копіювання
  displaySubSectionTitle('Резервне копіювання');
  console.log(`${colors.green}14.${colors.reset} Зробити резервну копію конфігурації`);
  console.log(`${colors.green}15.${colors.reset} Відновити з резервної копії`);
  
  // 5. Вихід
  displaySubSectionTitle('Інше');
  console.log(`${colors.green}0.${colors.reset} Вихід\n`);
  
  // Запит вибору пункту меню
  const choice = await askForNumber('Виберіть опцію', 0, 15);
  
  // Обробка вибору
  switch (choice) {
    // Налаштування проекту
    case 1:
      await initialSetup(rl, showMainMenu);
      break;
    case 2:
      await configureAll(rl, showMainMenu, 
        { startDevelopment, startProduction },
        { checkDockerIgnore }
      );
      break;
    case 3:
      await configureEnvFiles(rl, showMainMenu, createBackup);
      break;
    case 4:
      await checkDockerIgnore(rl, showMainMenu);
      break;
      
    // Локальний запуск
    case 5:
      await startFrontend(rl, showMainMenu);
      break;
    case 6:
      await startBackend(rl, showMainMenu);
      break;
    case 7:
      await startLocal(rl, showMainMenu);
      break;
      
    // Docker керування
    case 8:
      await startDevelopment(rl, showMainMenu);
      break;
    case 9:
      await startProduction(rl, showMainMenu);
      break;
    case 10:
      await stopContainers(rl, showMainMenu);
      break;
    case 11:
      await showContainerStatus(rl, showMainMenu);
      break;
    case 12:
      await showLogs(rl, showMainMenu);
      break;
    case 13:
      await rebuildProject(rl, showMainMenu);
      break;
      
    // Резервне копіювання
    case 14:
      const backupPath = createBackup('manual');
      if (backupPath) {
        log.success(`Резервну копію створено: ${backupPath}`);
      } else {
        log.error('Не вдалося створити резервну копію');
      }
      await waitForEnter();
      showMainMenu();
      break;
    case 15:
      await restoreFromBackup(rl, showMainMenu);
      break;
      
    // Вихід
    case 0:
      isRunning = false;
      closeReadline();
      displayGoodbye();
      process.exit(0);
      break;
    default:
      // Якщо введено некоректний вибір, повертаємося до головного меню
      log.error('Невірний вибір, спробуйте ще раз');
      setTimeout(showMainMenu, 2000);
      break;
  }
}

/**
 * Головна функція скрипту
 */
async function main() {
  try {
    // Перевірка вимог системи
    await checkRequirements();
    
    // Показуємо головне меню
    showMainMenu();
    
    // Обробник завершення роботи
    process.on('SIGINT', () => {
      if (isRunning) {
        displayGoodbye();
        closeReadline();
        process.exit(0);
      }
    });
  } catch (error) {
    log.error(`Помилка у скрипті: ${error.message}`);
    log.error(error.stack);
    closeReadline();
    process.exit(1);
  }
}

// Запускаємо скрипт
main(); 