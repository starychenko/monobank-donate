/**
 * Утиліта для роботи з кольорами в консолі
 */

// Кольори для консолі
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Функція для додавання кольору до тексту
 * @param {string} text - Текст для виводу
 * @param {string} color - Колір з об'єкту colors
 * @returns {string} Текст з кодами кольору
 */
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Готові функції для вивода кольорового тексту
 */
const log = {
  info: text => console.log(colorize(text, 'cyan')),
  success: text => console.log(colorize(text, 'green')),
  warning: text => console.log(colorize(text, 'yellow')),
  error: text => console.error(colorize(text, 'red')),
  highlight: text => console.log(colorize(text, 'bright')),
  title: text => console.log(`\n${colorize(text, 'bright')}${colorize(text, 'yellow')}\n`)
};

module.exports = {
  colors,
  colorize,
  log
}; 