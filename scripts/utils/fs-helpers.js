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
 * Оновлює значення змінної в .env файлі
 * @param {string} envFilePath - Шлях до файлу .env
 * @param {string} variableName - Назва змінної
 * @param {string} value - Нове значення змінної
 * @returns {boolean} - Успішність операції
 */
function updateEnvValue(envFilePath, variableName, value) {
  try {
    if (!fs.existsSync(envFilePath)) return false;

    let envContent = fs.readFileSync(envFilePath, 'utf8');
    const envLines = envContent.split('\n');
    let variableFound = false;

    // Пошук змінної в файлі
    const updatedLines = envLines.map(line => {
      if (line.startsWith(`${variableName}=`) || line.startsWith(`${variableName} =`)) {
        variableFound = true;
        return `${variableName}=${value}`;
      }
      return line;
    });

    // Якщо змінної немає, додаємо її в кінець файлу
    if (!variableFound) {
      updatedLines.push(`${variableName}=${value}`);
    }

    // Записуємо оновлений вміст
    fs.writeFileSync(envFilePath, updatedLines.join('\n'));
    return true;
  } catch (error) {
    console.error(`Помилка при оновленні змінної ${variableName}: ${error.message}`);
    return false;
  }
}

/**
 * Зчитує env-файл та парсить його в об'єкт
 * @param {string} filePath - Шлях до .env файлу
 * @returns {Object} - Об'єкт зі змінними середовища
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const envVars = {};

    lines.forEach(line => {
      // Ігноруємо коментарі та порожні рядки
      if (!line || line.startsWith('#')) {
        return;
      }

      // Розділяємо ключ та значення
      const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        const value = match[2] || '';
        
        // Видаляємо лапки, якщо вони є
        const trimmedValue = value.replace(/^['"]|['"]$/g, '');
        envVars[key] = trimmedValue;
      }
    });

    return envVars;
  } catch (error) {
    console.error(`Помилка при читанні .env файлу: ${error.message}`);
    return {};
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