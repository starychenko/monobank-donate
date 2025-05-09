/**
 * Модуль для керування резервними копіями
 */

const fs = require('fs');
const path = require('path');
const { colors, log } = require('../utils/colors');
const { rootDir } = require('../utils/command-runner');
const { fileExists, ensureDirectoryExists } = require('../utils/fs-helpers');

/**
 * Створює резервну копію важливих конфігураційних файлів
 * @param {string} type - Тип резервної копії (auto, pre-env-config, тощо)
 * @returns {string|null} - Шлях до створеної резервної копії або null у разі помилки
 */
function createBackup(type = 'auto') {
  log.info('Створюємо резервні копії конфігурації...');
  
  const backupDir = path.join(rootDir, 'backups');
  
  // Створюємо директорію для бекапів, якщо вона не існує
  ensureDirectoryExists(backupDir);
  
  // Формуємо ім'я для резервної копії з датою і часом
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${type}-backup-${timestamp}`;
  const backupPath = path.join(backupDir, backupName);
  
  // Створюємо директорію для поточної резервної копії
  ensureDirectoryExists(backupPath);
  
  try {
    // Копіюємо конфігураційні файли
    const filesToBackup = [
      // Docker-файли
      { path: 'docker-compose.yml', required: false },
      { path: 'docker-compose.dev.yml', required: false },
      { path: 'Dockerfile.frontend', required: false },
      { path: 'Dockerfile.backend', required: false },
      { path: '.dockerignore', required: false },
      
      // Frontend файли
      { path: path.join('frontend', '.env'), required: false },
      { path: path.join('frontend', '.env.example'), required: false },
      { path: path.join('frontend', 'vite.config.ts'), required: false },
      { path: path.join('frontend', 'nginx.conf'), required: false },
      
      // Backend файли
      { path: path.join('backend', '.env'), required: false },
      { path: path.join('backend', '.env.example'), required: false },
      
      // SSL сертифікати
      { path: path.join('ssl', 'server.key'), required: false },
      { path: path.join('ssl', 'server.crt'), required: false },
      { path: path.join('ssl', 'openssl.cnf'), required: false }
    ];
    
    let backedUpFiles = 0;
    
    for (const file of filesToBackup) {
      const fullPath = path.join(rootDir, file.path);
      
      try {
        if (fileExists(fullPath)) {
          // Створюємо підкаталоги у бекапі, якщо потрібно
          const targetDir = path.dirname(path.join(backupPath, file.path));
          ensureDirectoryExists(targetDir);
          
          // Читаємо та зберігаємо файл, зберігаючи оригінальну структуру директорій
          const content = fs.readFileSync(fullPath, 'utf8');
          const targetPath = path.join(backupPath, file.path);
          fs.writeFileSync(targetPath, content, 'utf8');
          backedUpFiles++;
        } else if (file.required) {
          log.warning(`Попередження: Файл ${file.path} не знайдено для створення резервної копії`);
        }
      } catch (fileError) {
        // Якщо помилка при роботі з окремим файлом, логуємо і продовжуємо
        log.warning(`Помилка при резервному копіюванні файлу ${file.path}: ${fileError.message}`);
      }
    }
    
    // Обмежуємо кількість резервних копій (зберігаємо останні 10)
    try {
      const allBackups = fs.readdirSync(backupDir)
        .filter(item => fs.statSync(path.join(backupDir, item)).isDirectory())
        .sort((a, b) => {
          const timeA = fs.statSync(path.join(backupDir, a)).mtime.getTime();
          const timeB = fs.statSync(path.join(backupDir, b)).mtime.getTime();
          return timeA - timeB; // Сортуємо за часом створення (старі спочатку)
        });
      
      // Видаляємо старі резервні копії, якщо їх більше 10
      const maxBackups = 10;
      if (allBackups.length > maxBackups) {
        const backupsToDelete = allBackups.slice(0, allBackups.length - maxBackups);
        
        for (const backupToDelete of backupsToDelete) {
          const backupPath = path.join(backupDir, backupToDelete);
          
          // Рекурсивна функція для видалення директорії
          const removeDir = (dirPath) => {
            if (fs.existsSync(dirPath)) {
              fs.readdirSync(dirPath).forEach(file => {
                const filePath = path.join(dirPath, file);
                if (fs.statSync(filePath).isDirectory()) {
                  removeDir(filePath);
                } else {
                  fs.unlinkSync(filePath);
                }
              });
              fs.rmdirSync(dirPath);
            }
          };
          
          removeDir(backupPath);
          log.info(`Видалено стару резервну копію: ${backupToDelete}`);
        }
      }
    } catch (rotationError) {
      log.warning(`Помилка при ротації резервних копій: ${rotationError.message}`);
    }
    
    if (backedUpFiles > 0) {
      log.success(`Створено резервну копію ${backedUpFiles} файлів у папці: ${backupPath}`);
      return backupPath;
    } else {
      log.warning('Не знайдено файлів для створення резервної копії');
      try {
        // Видаляємо порожню директорію
        fs.rmdirSync(backupPath);
      } catch (rmError) {
        // Якщо не вдалося видалити директорію, ігноруємо помилку
        log.warning(`Не вдалося видалити порожню директорію: ${rmError.message}`);
      }
      return null;
    }
  } catch (error) {
    log.error(`Помилка при створенні резервної копії: ${error.message}`);
    return null;
  }
}

/**
 * Відновлює файли з резервної копії
 * @param {Object} rl - Інтерфейс readline
 * @param {Function} showMainMenu - Функція для повернення до головного меню
 * @returns {Promise<void>}
 */
async function restoreFromBackup(rl, showMainMenu) {
  log.title('=== Відновлення з резервної копії ===');
  
  const backupDir = path.join(rootDir, 'backups');
  
  if (!fileExists(backupDir)) {
    log.warning('Резервних копій не знайдено');
    
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
    return;
  }
  
  // Отримуємо список директорій резервних копій
  const backups = fs.readdirSync(backupDir)
    .filter(item => fs.statSync(path.join(backupDir, item)).isDirectory())
    .sort((a, b) => {
      const timeA = fs.statSync(path.join(backupDir, a)).mtime.getTime();
      const timeB = fs.statSync(path.join(backupDir, b)).mtime.getTime();
      return timeB - timeA; // Сортуємо за часом створення (нові спочатку)
    });
  
  if (backups.length === 0) {
    log.warning('Резервних копій не знайдено');
    
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
    return;
  }
  
  // Виводимо список резервних копій
  log.info('Доступні резервні копії:');
  
  backups.forEach((backup, index) => {
    const backupPath = path.join(backupDir, backup);
    const backupStat = fs.statSync(backupPath);
    const backupDate = backupStat.mtime.toLocaleString();
    
    // Отримуємо список файлів у резервній копії
    const backupFiles = fs.readdirSync(backupPath).length;
    
    console.log(`${colors.green}${index + 1}.${colors.reset} ${backup} (${backupDate}, ${backupFiles} файлів)`);
  });
  
  // Запитуємо користувача, яку резервну копію відновити
  const backupIndex = await new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Виберіть резервну копію для відновлення (1-${backups.length}) або 0 для скасування: ${colors.reset}`, (answer) => {
      const index = parseInt(answer.trim(), 10);
      if (isNaN(index) || index < 0 || index > backups.length) {
        resolve(0);
      } else {
        resolve(index);
      }
    });
  });
  
  if (backupIndex === 0) {
    log.warning('Відновлення скасовано');
    
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
    return;
  }
  
  const selectedBackup = backups[backupIndex - 1];
  const backupPath = path.join(backupDir, selectedBackup);
  
  // Отримуємо список файлів у резервній копії
  const backupFiles = fs.readdirSync(backupPath);
  
  log.info('\nФайли для відновлення:');
  backupFiles.forEach(file => {
    console.log(`${colors.green}-${colors.reset} ${file}`);
  });
  
  // Запитуємо підтвердження
  const confirm = await new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Ви впевнені, що хочете відновити ці файли? (y/n): ${colors.reset}`, (answer) => {
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
  
  if (!confirm) {
    log.warning('Відновлення скасовано');
    
    await new Promise(resolve => {
      rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
    });
    
    showMainMenu();
    return;
  }
  
  // Створюємо резервну копію поточних файлів перед відновленням
  createBackup('pre-restore');
  
  // Відновлюємо файли
  try {
    let restoredFiles = 0;
    
    for (const file of backupFiles) {
      const sourceContent = fs.readFileSync(path.join(backupPath, file), 'utf8');
      let targetPath;
      
      // Визначаємо шлях для відновлення файлу
      if (file.startsWith('docker-compose')) {
        targetPath = path.join(rootDir, file);
      } else if (file.startsWith('frontend-.env')) {
        targetPath = path.join(rootDir, 'frontend', '.env');
      } else if (file.startsWith('backend-.env')) {
        targetPath = path.join(rootDir, 'backend', '.env');
      } else {
        log.warning(`Пропускаємо файл ${file} - невідомий формат`);
        continue;
      }
      
      // Створюємо директорії, якщо вони не існують
      ensureDirectoryExists(path.dirname(targetPath));
      
      // Записуємо вміст файлу
      fs.writeFileSync(targetPath, sourceContent, 'utf8');
      log.success(`Відновлено файл: ${targetPath}`);
      restoredFiles++;
    }
    
    log.success(`\nУспішно відновлено ${restoredFiles} файлів з резервної копії`);
  } catch (error) {
    log.error(`Помилка при відновленні з резервної копії: ${error.message}`);
  }
  
  await new Promise(resolve => {
    rl.question(`\n${colors.yellow}Натисніть Enter для повернення до головного меню...${colors.reset}`, resolve);
  });
  
  showMainMenu();
}

module.exports = {
  createBackup,
  restoreFromBackup
}; 