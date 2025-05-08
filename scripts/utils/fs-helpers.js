/**
 * Утиліта для роботи з файловою системою
 */

const fs = require('fs');
const path = require('path');
const { colors, log } = require('./colors');
const { rootDir } = require('./command-runner');

/**
 * Перевіряє наявність файлу
 * @param {string} filePath - Шлях до файлу
 * @returns {boolean} - Чи існує файл
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Створює директорію, якщо вона не існує
 * @param {string} dirPath - Шлях до директорії
 * @returns {boolean} - Результат операції
 */
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log.info(`Створено директорію: ${dirPath}`);
    }
    return true;
  } catch (error) {
    log.error(`Помилка при створенні директорії ${dirPath}: ${error.message}`);
    return false;
  }
}

/**
 * Читає вміст файлу
 * @param {string} filePath - Шлях до файлу
 * @param {string} encoding - Кодування (за замовчуванням utf8)
 * @returns {string|null} - Вміст файлу або null у разі помилки
 */
function readFileContent(filePath, encoding = 'utf8') {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, encoding);
  } catch (error) {
    log.error(`Помилка при читанні файлу ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Записує вміст у файл
 * @param {string} filePath - Шлях до файлу
 * @param {string} content - Вміст для запису
 * @param {string} encoding - Кодування (за замовчуванням utf8)
 * @returns {boolean} - Результат операції
 */
function writeFileContent(filePath, content, encoding = 'utf8') {
  try {
    // Створюємо директорію для файлу, якщо вона не існує
    const dirPath = path.dirname(filePath);
    ensureDirectoryExists(dirPath);
    
    fs.writeFileSync(filePath, content, encoding);
    return true;
  } catch (error) {
    log.error(`Помилка при записі файлу ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Парсить файл .env і повертає об'єкт зі змінними
 * @param {string} filePath - Шлях до .env файлу
 * @returns {Object} - Об'єкт з ключами та значеннями з .env файлу
 */
function parseEnvFile(filePath) {
  const result = {};
  const content = readFileContent(filePath);
  
  if (!content) {
    return result;
  }
  
  content.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('='); // На випадок, якщо у значенні є символ =
      if (key) {
        result[key.trim()] = value.trim();
      }
    }
  });
  
  return result;
}

/**
 * Додає або оновлює значення у файлі .env
 * @param {string} filePath - Шлях до .env файлу
 * @param {string} key - Ключ
 * @param {string} value - Значення
 * @returns {boolean} - Результат операції
 */
function updateEnvValue(filePath, key, value) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let found = false;
    
    const updatedLines = lines.map(line => {
      if (line.startsWith(key + '=')) {
        found = true;
        return `${key}=${value}`;
      }
      return line;
    });
    
    // Якщо ключ не знайдено, додаємо його в кінець файлу
    if (!found) {
      updatedLines.push(`${key}=${value}`);
    }
    
    fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf8');
    return true;
  } catch (error) {
    log.error(`Помилка при оновленні файлу ${filePath}: ${error.message}`);
    return false;
  }
}

module.exports = {
  fileExists,
  ensureDirectoryExists,
  readFileContent,
  writeFileContent,
  parseEnvFile,
  updateEnvValue
}; 