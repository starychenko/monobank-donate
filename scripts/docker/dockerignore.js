/**
 * Модуль для роботи з .dockerignore файлом
 */

const fs = require('fs');
const path = require('path');
const { colors, log } = require('../utils/colors');
const { rootDir } = require('../utils/command-runner');
const { waitForEnter } = require('../ui/prompts');
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
 * Перевіряє та оновлює .dockerignore файл
 * @param {Object} rl - Інтерфейс readline
 * @param {Function|boolean} showMainMenu - Функція для повернення до головного меню або прапорець interactive
 * @param {boolean} interactive - Чи потрібно запитувати користувача
 * @returns {Promise<boolean>} - Результат операції
 */
async function checkDockerIgnore(rl, showMainMenu, interactive = true) {
  // Якщо другий параметр - булевий, це старий виклик, переназначаємо параметри
  if (typeof showMainMenu === 'boolean') {
    interactive = showMainMenu;
    showMainMenu = null;
  }
  
  if (interactive) {
    log.title('=== Перевірка .dockerignore ===');
  }
  
  // Необхідні правила для .dockerignore
  const requiredRules = [
    '.git',
    'node_modules',
    'npm-debug.log',
    'backups',
    '.vscode',
    '.DS_Store',
    '/frontend/node_modules',
    '/backend/node_modules',
    '/frontend/build',
    '/frontend/dist',
    '/backend/dist',
    'README.md',
    '.env',
    '.env.local',
    '.env.development.local',
    '.env.test.local',
    '.env.production.local'
  ];
  
  const dockerIgnorePath = path.join(rootDir, '.dockerignore');
  let needsUpdate = false;
  
  // Перевіряємо, чи існує файл .dockerignore
  if (!fileExists(dockerIgnorePath)) {
    log.info('.dockerignore файл не знайдено. Створюємо новий.');
    
    try {
      fs.writeFileSync(dockerIgnorePath, requiredRules.join('\n'));
      log.success('.dockerignore файл створено з необхідними правилами.');
    } catch (error) {
      log.error(`Помилка при створенні .dockerignore файлу: ${error.message}`);
      if (interactive && typeof showMainMenu === 'function') {
        await waitForEnter();
        showMainMenu();
      }
      return false;
    }
  } else {
    log.info('Перевірка .dockerignore файлу...');
    
    // Читаємо існуючий файл
    let existingContent;
    try {
      existingContent = fs.readFileSync(dockerIgnorePath, 'utf8');
    } catch (error) {
      log.error(`Помилка при читанні .dockerignore файлу: ${error.message}`);
      if (interactive && typeof showMainMenu === 'function') {
        await waitForEnter();
        showMainMenu();
      }
      return false;
    }
    
    // Розділяємо на рядки і видаляємо порожні
    const existingRules = existingContent.split('\n').map(line => line.trim()).filter(line => line !== '');
    
    // Перевіряємо, чи всі необхідні правила присутні
    const missingRules = requiredRules.filter(rule => !existingRules.includes(rule));
    
    if (missingRules.length > 0) {
      log.warning('У .dockerignore файлі відсутні деякі необхідні правила.');
      
      if (interactive) {
        const addRules = await new Promise((resolve) => {
          rl.question(`${colors.yellow}Додати ${missingRules.length} правила до .dockerignore? (y/n): ${colors.reset}`, (answer) => {
            resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
          });
        });
        
        if (addRules) {
          needsUpdate = true;
        } else {
          log.warning('Правила не додано. Це може вплинути на роботу Docker контейнерів.');
          if (typeof showMainMenu === 'function') {
            await waitForEnter();
            showMainMenu();
          }
          return false;
        }
      } else {
        // В автоматичному режимі додаємо правила без запиту
        needsUpdate = true;
      }
    } else {
      log.success('.dockerignore файл вже містить всі необхідні правила.');
      if (interactive && typeof showMainMenu === 'function') {
        await waitForEnter();
        showMainMenu();
      }
      return true;
    }
    
    // Оновлюємо файл, якщо потрібно
    if (needsUpdate) {
      try {
        // Додаємо відсутні правила до існуючих
        const updatedRules = [...existingRules, ...missingRules];
        fs.writeFileSync(dockerIgnorePath, updatedRules.join('\n'));
        log.success('.dockerignore файл оновлено з усіма необхідними правилами.');
      } catch (error) {
        log.error(`Помилка при оновленні .dockerignore файлу: ${error.message}`);
        if (interactive && typeof showMainMenu === 'function') {
          await waitForEnter();
          showMainMenu();
        }
        return false;
      }
    }
  }
  
  if (interactive && typeof showMainMenu === 'function') {
    await waitForEnter();
    showMainMenu();
  }
  return true;
}

module.exports = {
  checkDockerIgnore,
  defaultDockerIgnoreContent,
  requiredIgnores
}; 