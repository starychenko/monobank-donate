/**
 * Модуль для початкового налаштування проекту
 */

const { colors, log } = require('../utils/colors');
const { runCommand, frontendDir, backendDir } = require('../utils/command-runner');
const { createBackup } = require('../backup/backup-manager');
const { configureEnvFiles } = require('./env-manager');
const { waitForEnter } = require('../ui/prompts');
const { checkFrontendDependencies, checkBackendDependencies } = require('../utils/dependency-checker');

/**
 * Початкове налаштування проекту
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function initialSetup(rl, showMainMenu) {
  log.title('=== Початкове налаштування проекту ===');

  // 1. Перевірка наявності Node.js
  log.info('Перевірка вимог...');
  try {
    const nodeVersion = require('child_process').execSync('node --version', { encoding: 'utf8' }).trim();
    log.success(`Node.js: ${nodeVersion}`);
  } catch (error) {
    log.error('Node.js не встановлено! Будь ласка, встановіть Node.js версії 16 або вище.');
    await waitForEnter();
    showMainMenu();
    return;
  }

  // 2. Встановлення залежностей Backend
  log.info('\nВстановлення залежностей backend...');
  if (checkBackendDependencies()) {
    log.success('Залежності backend успішно встановлені!');
  } else {
    log.error('Помилка при встановленні залежностей backend!');
    log.warning('Спробуйте встановити залежності вручну:');
    log.warning(`cd backend && npm install`);
    
    await waitForEnter();
    showMainMenu();
    return;
  }

  // 3. Встановлення залежностей Frontend
  log.info('\nВстановлення залежностей frontend...');
  if (checkFrontendDependencies()) {
    log.success('Залежності frontend успішно встановлені!');
  } else {
    log.error('Помилка при встановленні залежностей frontend!');
    log.warning('Спробуйте встановити залежності вручну:');
    log.warning(`cd frontend && npm install`);
    
    await waitForEnter();
    showMainMenu();
    return;
  }

  // 4. Створення та налаштування .env файлів
  await configureEnvFiles(rl, showMainMenu, createBackup);
}

/**
 * Повне налаштування проекту за один крок
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @param {Object} dockerManager - Об'єкт з функціями для керування Docker
 * @param {Object} dockerIgnoreManager - Об'єкт з функціями для керування .dockerignore
 * @returns {Promise<void>}
 */
async function configureAll(rl, showMainMenu, dockerManager, dockerIgnoreManager) {
  log.title('=== Повне налаштування проекту ===');
  
  log.info('Цей майстер проведе вас через процес налаштування всього проекту.');
  log.info('Спочатку ми налаштуємо змінні середовища, а потім параметри Docker.');
  
  // Перевіряємо наявність Node.js
  log.info('Перевірка вимог...');
  try {
    const nodeVersion = require('child_process').execSync('node --version', { encoding: 'utf8' }).trim();
    log.success(`Node.js: ${nodeVersion}`);
  } catch (error) {
    log.error('Node.js не встановлено! Будь ласка, встановіть Node.js версії 16 або вище.');
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Перевіряємо та встановлюємо залежності
  log.info('Перевірка залежностей...');
  
  // Перевірка backend
  if (!checkBackendDependencies()) {
    log.error('Помилка при встановленні залежностей backend!');
    log.warning('Спробуйте встановити залежності вручну: cd backend && npm install');
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Перевірка frontend
  if (!checkFrontendDependencies()) {
    log.error('Помилка при встановленні залежностей frontend!');
    log.warning('Спробуйте встановити залежності вручну: cd frontend && npm install');
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Створюємо резервну копію перед початком
  createBackup('pre-full-config');
  
  // Крок 1: Налаштування .env файлів
  log.title('Крок 1: Налаштування змінних середовища (.env файли)');
  
  // Викликаємо configureEnvFiles з нашим callback для повернення в цей процес, а не в головне меню
  // Створюємо проміжний callback, який просто продовжить виконання цієї функції
  await configureEnvFiles(rl, async () => {
    // Продовжуємо налаштування після .env файлів
    
    // Крок 2: Налаштування Docker
    log.title('Крок 2: Налаштування Docker');
    
    // Запитуємо користувача про налаштування Docker
    log.info('Налаштування портів для Docker...');
    
    const frontendPort = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Введіть порт для frontend (80): ${colors.reset}`, (answer) => {
        resolve(answer.trim() || '80');
      });
    });
    
    const backendPort = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Введіть порт для backend (3001): ${colors.reset}`, (answer) => {
        resolve(answer.trim() || '3001');
      });
    });
    
    const useVolumeForFrontend = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Використовувати том для frontend у режимі розробки? (y/n): ${colors.reset}`, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
      });
    });
    
    const useVolumeForBackend = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Використовувати том для backend у режимі розробки? (y/n): ${colors.reset}`, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
      });
    });
    
    // Крок 3: Перевірка .dockerignore
    log.title('Крок 3: Перевірка .dockerignore');
    await dockerIgnoreManager.checkDockerIgnore(rl);
    
    // Крок 4: Генерація Docker-compose файлів
    log.title('Крок 4: Генерація Docker-compose файлів');
    
    // Імпортуємо модуль для генерації docker-compose файлів
    const { generateDockerComposeFiles } = require('../docker/compose-generator');
    
    // Генеруємо docker-compose файли з налаштуваннями
    await generateDockerComposeFiles({
      frontendPort,
      backendPort,
      useVolumeForFrontend,
      useVolumeForBackend
    });
    
    log.success('\nПовне налаштування проекту завершено!');
    log.success('Проект готовий до запуску.');
    
    // Запитуємо, чи хоче користувач запустити проект
    const startProject = await new Promise((resolve) => {
      rl.question(`\n${colors.yellow}Бажаєте запустити проект зараз? (y/n) ${colors.reset}`, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
      });
    });
    
    if (startProject) {
      log.warning('Як ви хочете запустити проект?');
      console.log(`${colors.green}1.${colors.reset} Через Docker (розробка)`);
      console.log(`${colors.green}2.${colors.reset} Через Docker (продакшн)`);
      console.log(`${colors.green}3.${colors.reset} Локально (frontend + backend)`);
      console.log(`${colors.green}4.${colors.reset} Повернутися до головного меню`);
      
      const startChoice = await new Promise((resolve) => {
        rl.question(`\n${colors.yellow}Ваш вибір (1-4): ${colors.reset}`, (answer) => {
          resolve(answer.trim());
        });
      });
      
      switch (startChoice) {
        case '1':
          await dockerManager.startDevelopment(rl, showMainMenu);
          break;
        case '2':
          await dockerManager.startProduction(rl, showMainMenu);
          break;
        case '3':
          // Імпортуємо функцію для локального запуску
          const { startLocal } = require('../local/combined');
          await startLocal(rl, showMainMenu);
          break;
        default:
          showMainMenu();
          break;
      }
    } else {
      await waitForEnter();
      showMainMenu();
    }
  }, createBackup);
}

module.exports = {
  initialSetup,
  configureAll
}; 