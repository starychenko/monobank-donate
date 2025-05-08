/**
 * Модуль для інтерактивних запитів користувача
 */

const readline = require('readline');
const { colors } = require('../utils/colors');

// Глобальний інтерфейс readline
let rl;

/**
 * Налаштовує інтерфейс readline
 * @returns {Object} Інтерфейс readline
 */
function setupReadline() {
  if (rl) {
    return rl;
  }
  
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return rl;
}

/**
 * Запитує користувача з кольоровим повідомленням
 * @param {string} question - Запитання
 * @param {string} color - Колір запитання (yellow за замовчуванням)
 * @returns {Promise<string>} - Відповідь користувача
 */
function ask(question, color = 'yellow') {
  const coloredQuestion = `${colors[color]}${question}${colors.reset}`;
  return new Promise((resolve) => {
    rl.question(coloredQuestion, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Запитує користувача так/ні
 * @param {string} question - Запитання
 * @returns {Promise<boolean>} - true якщо користувач відповів "так"
 */
function askYesNo(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} (y/n) ${colors.reset}`, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

/**
 * Запитує користувача вибрати пункт з меню
 * @param {string} question - Запитання
 * @param {number} min - Мінімальне значення
 * @param {number} max - Максимальне значення
 * @returns {Promise<number>} - Обране користувачем число
 */
function askForNumber(question, min, max) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} (${min}-${max}): ${colors.reset}`, (answer) => {
      const num = parseInt(answer.trim(), 10);
      if (isNaN(num) || num < min || num > max) {
        resolve(min - 1); // Повертаємо невалідне значення
      } else {
        resolve(num);
      }
    });
  });
}

/**
 * Запитує користувача значення з значенням за замовчуванням
 * @param {string} question - Запитання
 * @param {string} defaultValue - Значення за замовчуванням
 * @returns {Promise<string>} - Відповідь користувача або значення за замовчуванням
 */
function askWithDefault(question, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question} ${colors.bright}(${defaultValue})${colors.reset}${colors.yellow}:${colors.reset} `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Очікує натискання Enter
 * @param {string} message - Повідомлення
 * @returns {Promise<void>}
 */
function waitForEnter(message = 'Натисніть Enter для продовження...') {
  return new Promise(resolve => {
    rl.question(`\n${colors.yellow}${message}${colors.reset}`, resolve);
  });
}

/**
 * Закриває інтерфейс readline
 */
function closeReadline() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

module.exports = {
  setupReadline,
  ask,
  askYesNo,
  askForNumber,
  askWithDefault,
  waitForEnter,
  closeReadline
}; 