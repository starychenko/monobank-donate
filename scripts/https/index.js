/**
 * Модуль для налаштування HTTPS у проекті Monobank Donate
 */

const { colors, log } = require('../utils/colors');
const { setupSSLCertificates } = require('./certificates');
const { configureHttps } = require('./https-config');
const { waitForEnter, askYesNo } = require('../ui/prompts');
const { createBackup } = require('../backup/backup-manager');

/**
 * Головна функція налаштування HTTPS
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function setupHttps(rl, showMainMenu) {
  log.title('=== Налаштування HTTPS для проекту ===');

  // Створюємо резервну копію перед внесенням змін
  createBackup('pre-https-setup');

  log.info('Цей майстер проведе вас через процес налаштування HTTPS для проекту.');
  
  // Запитуємо домен
  const domain = await new Promise((resolve) => {
    rl.question(`${colors.yellow}Введіть домен для використання з HTTPS (localhost): ${colors.reset}`, (answer) => {
      resolve(answer.trim() || 'localhost');
    });
  });
  
  log.info(`Обрано домен: ${domain}`);
  
  // Генеруємо або використовуємо існуючі сертифікати
  const certResult = await setupSSLCertificates(rl, domain);
  
  if (!certResult.success) {
    log.error('Не вдалося налаштувати SSL-сертифікати.');
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  // Конфігуруємо проект для підтримки HTTPS
  const httpsConfigured = await configureHttps(rl, domain, certResult);
  
  if (!httpsConfigured) {
    log.error('Не вдалося повністю налаштувати HTTPS. Проект може працювати некоректно.');
    await waitForEnter();
    showMainMenu();
    return;
  }
  
  log.success('HTTPS налаштування завершено успішно!');
  
  // Запитуємо, чи хоче користувач запустити проект з HTTPS
  const startHttps = await askYesNo('Бажаєте запустити проект з HTTPS зараз?');
  
  if (startHttps) {
    log.info('Вибір режиму запуску:');
    console.log(`${colors.green}1.${colors.reset} Через Docker (розробка)`);
    console.log(`${colors.green}2.${colors.reset} Через Docker (продакшн)`);
    console.log(`${colors.green}3.${colors.reset} Локально (через Vite та Node.js)`);
    console.log(`${colors.green}4.${colors.reset} Повернутися до головного меню`);
    
    const choice = await new Promise((resolve) => {
      rl.question(`\n${colors.yellow}Ваш вибір (1-4): ${colors.reset}`, (answer) => {
        resolve(answer.trim());
      });
    });
    
    switch (choice) {
      case '1': {
        // Запуск Docker в режимі розробки
        const { startDevelopment } = require('../docker/container-manager');
        await startDevelopment(rl, showMainMenu);
        break;
      }
      case '2': {
        // Запуск Docker в продакшен режимі
        const { startProduction } = require('../docker/container-manager');
        await startProduction(rl, showMainMenu);
        break;
      }
      case '3': {
        // Локальний запуск
        const { startLocal } = require('../local/combined');
        await startLocal(rl, showMainMenu);
        break;
      }
      default:
        await waitForEnter();
        showMainMenu();
        break;
    }
  } else {
    await waitForEnter();
    showMainMenu();
  }
}

module.exports = {
  setupHttps
}; 