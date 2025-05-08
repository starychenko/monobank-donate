/**
 * Утиліта для перевірки та встановлення залежностей проекту
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { colors, log } = require('./colors');
const { frontendDir, backendDir } = require('./command-runner');

/**
 * Перевіряє та за потреби встановлює залежності для вказаної директорії
 * @param {string} dir - Шлях до директорії (frontend або backend)
 * @param {string} name - Назва частини проекту для логів (Frontend або Backend)
 * @returns {boolean} - Результат операції
 */
function checkAndInstallDependencies(dir, name) {
  const nodeModulesPath = path.join(dir, 'node_modules');
  const packageLockPath = path.join(dir, 'package-lock.json');

  // Перевіряємо наявність node_modules або package-lock.json
  if (!fs.existsSync(nodeModulesPath) && !fs.existsSync(packageLockPath)) {
    log.warning(`${name} залежності не встановлено. Встановлюємо...`);
    
    try {
      // Запускаємо npm install
      execSync('npm install', { 
        cwd: dir, 
        stdio: 'inherit'
      });
      
      log.success(`${name} залежності успішно встановлено!`);
      return true;
    } catch (error) {
      log.error(`Помилка при встановленні залежностей для ${name}: ${error.message}`);
      return false;
    }
  }
  
  return true; // Залежності вже встановлені
}

/**
 * Перевіряє та встановлює залежності для frontend
 * @returns {boolean} - Результат операції
 */
function checkFrontendDependencies() {
  return checkAndInstallDependencies(frontendDir, 'Frontend');
}

/**
 * Перевіряє та встановлює залежності для backend
 * @returns {boolean} - Результат операції
 */
function checkBackendDependencies() {
  return checkAndInstallDependencies(backendDir, 'Backend');
}

module.exports = {
  checkFrontendDependencies,
  checkBackendDependencies
}; 