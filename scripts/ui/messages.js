/**
 * Модуль для відображення системних повідомлень
 */

const { colors, log } = require('../utils/colors');

/**
 * Виводить вітальне повідомлення
 */
function displayWelcome() {
  console.log(`${colors.bright}${colors.green}Monobank Donate - Центральний скрипт керування проектом${colors.reset}`);
}

/**
 * Виводить повідомлення про завершення роботи
 */
function displayGoodbye() {
  console.log(`\n${colors.green}Дякую за використання! До побачення.${colors.reset}`);
}

/**
 * Виводить заголовок секції
 * @param {string} title - Заголовок
 */
function displaySectionTitle(title) {
  console.log(`\n${colors.bright}${colors.yellow}=== ${title} ===${colors.reset}\n`);
}

/**
 * Виводить заголовок підсекції
 * @param {string} title - Заголовок підсекції
 */
function displaySubSectionTitle(title) {
  console.log(`\n${colors.bright}${colors.cyan}${title}:${colors.reset}`);
}

/**
 * Виводить результат операції
 * @param {boolean} success - Успішність операції
 * @param {string} successMessage - Повідомлення у випадку успіху
 * @param {string} errorMessage - Повідомлення у випадку помилки
 */
function displayOperationResult(success, successMessage, errorMessage) {
  if (success) {
    log.success(successMessage);
  } else {
    log.error(errorMessage);
  }
}

/**
 * Виводить помилку з можливістю додаткової інформації
 * @param {string} message - Повідомлення про помилку
 * @param {Error|null} error - Об'єкт помилки (опціонально)
 */
function displayError(message, error = null) {
  if (error) {
    log.error(`${message}: ${error.message}`);
  } else {
    log.error(message);
  }
}

/**
 * Виводить підказку для користувача
 * @param {string} message - Текст підказки
 */
function displayHint(message) {
  console.log(`${colors.cyan}Підказка: ${colors.reset}${message}`);
}

/**
 * Виводить URL доступу до сервісів
 * @param {string} frontendPort - Порт frontend
 * @param {string} backendPort - Порт backend
 */
function displayServiceUrls(frontendPort, backendPort) {
  console.log(`${colors.blue}Фронтенд доступний за адресою: ${colors.cyan}http://localhost:${frontendPort}${colors.reset}`);
  console.log(`${colors.blue}Бекенд доступний за адресою: ${colors.cyan}http://localhost:${backendPort}${colors.reset}`);
}

/**
 * Виводить повідомлення-роздільник
 */
function displayDivider() {
  console.log(`\n${colors.yellow}${'='.repeat(50)}${colors.reset}\n`);
}

/**
 * Очищує екран консолі
 */
function clearScreen() {
  console.clear();
}

module.exports = {
  displayWelcome,
  displayGoodbye,
  displaySectionTitle,
  displaySubSectionTitle,
  displayOperationResult,
  displayError,
  displayHint,
  displayServiceUrls,
  displayDivider,
  clearScreen
}; 