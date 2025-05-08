/**
 * Модуль для роботи з .dockerignore файлом
 */

const fs = require('fs');
const path = require('path');
const { colors, log } = require('../utils/colors');
const { rootDir } = require('../utils/command-runner');
const { fileExists, writeFileContent } = require('../utils/fs-helpers');

/**
 * Стандартний вміст .dockerignore файлу
 */
const defaultDockerIgnoreContent = `# Стандартні директорії та файли
node_modules
.git
.github
.vscode
.idea
.cursor

# Логи
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Файли змінних середовища (змінні передаються через docker-compose)
.env
.env.*

# Бекапи та інші
backups
`;

/**
 * Список необхідних правил ігнорування для Docker
 */
const requiredIgnores = [
  'node_modules',
  '.git',
  '.github',
  '.cursor',
  '*.log',
  '.env',
  '.env.*',
  'backups'
];

/**
 * Перевірка та оновлення .dockerignore файлу
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення в головне меню
 * @returns {Promise<boolean>} - Результат операції
 */
async function checkDockerIgnore(rl, showMainMenu) {
  log.info('Перевірка .dockerignore файлу...');
  
  const dockerIgnorePath = path.join(rootDir, '.dockerignore');
  
  // Якщо файл не існує, створюємо його
  if (!fileExists(dockerIgnorePath)) {
    log.warning('Файл .dockerignore не знайдено. Створюємо новий...');
    try {
      writeFileContent(dockerIgnorePath, defaultDockerIgnoreContent);
      log.success('Створено .dockerignore файл з налаштуваннями за замовчуванням');
      
      if (showMainMenu) {
        await new Promise(resolve => {
          rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
        });
        showMainMenu();
      }
      
      return true;
    } catch (error) {
      log.error(`Помилка при створенні .dockerignore файлу: ${error.message}`);
      
      if (showMainMenu) {
        await new Promise(resolve => {
          rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
        });
        showMainMenu();
      }
      
      return false;
    }
  }
  
  // Перевірка існуючого файлу
  try {
    const currentContent = fs.readFileSync(dockerIgnorePath, 'utf8');
    let needsUpdate = false;
    
    // Перевіряємо наявність всіх необхідних правил
    for (const rule of requiredIgnores) {
      if (!currentContent.includes(rule)) {
        needsUpdate = true;
        break;
      }
    }
    
    if (needsUpdate) {
      log.warning('Знайдено .dockerignore файл, але він не містить всіх необхідних правил.');
      const shouldUpdate = await new Promise((resolve) => {
        rl.question(`${colors.yellow}Бажаєте оновити його? (y/n) ${colors.reset}`, answer => {
          resolve(answer.trim().toLowerCase() === 'y');
        });
      });
      
      if (shouldUpdate) {
        writeFileContent(dockerIgnorePath, defaultDockerIgnoreContent);
        log.success('.dockerignore файл оновлено.');
      } else {
        log.warning('Залишаємо .dockerignore без змін.');
      }
    } else {
      log.success('.dockerignore файл вже містить всі необхідні правила.');
    }
    
    if (showMainMenu) {
      await new Promise(resolve => {
        rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
      });
      showMainMenu();
    }
    
    return true;
  } catch (error) {
    log.error(`Помилка при перевірці .dockerignore файлу: ${error.message}`);
    
    if (showMainMenu) {
      await new Promise(resolve => {
        rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
      });
      showMainMenu();
    }
    
    return false;
  }
}

module.exports = {
  checkDockerIgnore,
  defaultDockerIgnoreContent,
  requiredIgnores
}; 