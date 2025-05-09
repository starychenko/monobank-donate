/**
 * Модуль для початкового налаштування проекту
 */

const { colors, log } = require('../utils/colors');
const { runCommand, frontendDir, backendDir } = require('../utils/command-runner');
const { createBackup } = require('../backup/backup-manager');
const { configureEnvFiles } = require('./env-manager');
const { waitForEnter, askYesNo } = require('../ui/prompts');
const { checkFrontendDependencies, checkBackendDependencies } = require('../utils/dependency-checker');
const { setupSSLCertificates } = require('../https/certificates');
const { configureHttps } = require('../https/https-config');

/**
 * Налаштування проекту за один крок
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @param {Object} dockerManager - Об'єкт з функціями для керування Docker
 * @param {Object} dockerIgnoreManager - Об'єкт з функціями для керування .dockerignore
 * @returns {Promise<void>}
 */
async function configureAll(rl, showMainMenu, dockerManager, dockerIgnoreManager) {
  log.title('=== Налаштування проекту ===');
  
  log.info('Цей майстер налаштує проект в автоматизованому режимі з мінімальною кількістю запитань.');
  
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
  
  // Перевіряємо та встановлюємо залежності автоматично
  log.info('Перевірка та встановлення залежностей...');
  
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
  log.info('Створюємо резервну копію конфігурації...');
  createBackup('pre-full-config');
  
  // Збираємо всю необхідну інформацію спочатку
  const config = {
    frontend: {
      port: '80',
      useVolume: true,
      jarURL: 'https://send.monobank.ua/jar/58vdbegH3T',
      updateInterval: '15000'
    },
    backend: {
      port: '3001',
      useVolume: true,
      cacheTTL: '15'
    },
    https: {
      enabled: false,
      domain: 'localhost'
    }
  };
  
  // Запитуємо основну інформацію про Monobank збір
  log.stepTitle('Загальні налаштування проекту');

  config.frontend.jarURL = await new Promise((resolve) => {
    rl.question(`${colors.yellow}URL банки Monobank (${config.frontend.jarURL}): ${colors.reset}`, (answer) => {
      resolve(answer.trim() || config.frontend.jarURL);
    });
  });

  // Запитуємо про налаштування портів
  config.frontend.port = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Порт для frontend (${config.frontend.port}): ${colors.reset}`, (answer) => {
      resolve(answer.trim() || config.frontend.port);
    });
  });
  
  config.backend.port = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Порт для backend (${config.backend.port}): ${colors.reset}`, (answer) => {
      resolve(answer.trim() || config.backend.port);
    });
  });
  
  // Запитуємо про HTTPS один раз
  config.https.enabled = await askYesNo('Налаштувати HTTPS для проекту?');
  
  if (config.https.enabled) {
    config.https.domain = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Введіть домен для HTTPS (${config.https.domain}): ${colors.reset}`, (answer) => {
        resolve(answer.trim() || config.https.domain);
      });
    });
  }
  
  // Автоматично перевіряємо та налаштовуємо .dockerignore
  log.info('Перевірка .dockerignore файлу...');
  await dockerIgnoreManager.checkDockerIgnore(rl, null, false); // null для showMainMenu, false для автоматичного режиму
  
  // Налаштування .env файлів з зібраними даними
  log.stepTitle('Налаштування змінних середовища (.env файли)');
  
  // Замість використання configureEnvFiles, створюємо власну логіку, яка використовує зібрані дані
  const { createEnvFiles } = require('./env-manager');
  
  await createEnvFiles({
    frontend: {
      VITE_MONOBANK_JAR_URL: config.frontend.jarURL,
      VITE_UPDATE_INTERVAL: config.frontend.updateInterval,
      VITE_USE_HTTPS: config.https.enabled ? 'true' : 'false',
      VITE_DOMAIN: config.https.domain,
      VITE_API_URL: config.https.enabled 
        ? `https://${config.https.domain}:${config.backend.port}/api/parse-monobank`
        : `http://${config.https.domain}:${config.backend.port}/api/parse-monobank`
    },
    backend: {
      DEFAULT_JAR_URL: config.frontend.jarURL,
      CACHE_TTL: config.backend.cacheTTL,
      PORT: config.backend.port,
      ALLOWED_ORIGINS: config.https.enabled
        ? `https://${config.https.domain},https://${config.https.domain}:443,https://${config.https.domain}:${config.frontend.port}`
        : `http://${config.https.domain},http://${config.https.domain}:${config.frontend.port}`,
      USE_HTTPS: config.https.enabled ? 'true' : 'false',
      DOMAIN: config.https.domain
    }
  });
  
  // Генерація Docker-compose файлів
  log.stepTitle('Налаштування Docker');
  
  // Імпортуємо модуль для генерації docker-compose файлів
  const { generateDockerComposeFiles } = require('../docker/compose-generator');
  
  // Генеруємо docker-compose файли з налаштуваннями
  await generateDockerComposeFiles({
    frontendPort: config.frontend.port,
    backendPort: config.backend.port,
    useVolumeForFrontend: config.frontend.useVolume,
    useVolumeForBackend: config.backend.useVolume,
    httpsEnabled: config.https.enabled,
    domain: config.https.domain
  });
  
  // Якщо HTTPS увімкнено, налаштовуємо сертифікати та конфігурацію
  if (config.https.enabled) {
    log.stepTitle('Налаштування HTTPS');
    
    // Генеруємо сертифікати
    const certResult = await setupSSLCertificates(rl, config.https.domain);
    
    if (certResult.success) {
      // Конфігуруємо проект для підтримки HTTPS
      await configureHttps(rl, config.https.domain, certResult);
    } else {
      log.warning('Не вдалося згенерувати SSL-сертифікати. Проект буде працювати через HTTP.');
      // Повертаємо налаштування HTTPS до false
      config.https.enabled = false;
      
      // Оновлюємо .env файли, щоб вимкнути HTTPS
      await createEnvFiles({
        frontend: {
          VITE_USE_HTTPS: 'false'
        },
        backend: {
          USE_HTTPS: 'false'
        }
      }, true); // true для оновлення існуючих файлів
    }
  }
  
  log.success('\nПовне налаштування проекту завершено!');
  log.success('Проект готовий до запуску.');
  
  // Запитуємо, чи хоче користувач запустити проект
  const startProject = await askYesNo('Бажаєте запустити проект зараз?');
  
  if (startProject) {
    log.info('Виберіть режим запуску:');
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
}

module.exports = {
  configureAll
}; 