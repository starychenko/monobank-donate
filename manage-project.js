#!/usr/bin/env node

/**
 * Центральний скрипт керування проектом Monobank Donate
 * Запускає модульну версію з папки scripts/
 */

const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

// Перевіряємо наявність залежностей
function checkAndInstallDependencies() {
  const scriptsDir = path.join(__dirname, 'scripts');
  const packageJsonPath = path.join(scriptsDir, 'package.json');
  const nodeModulesPath = path.join(scriptsDir, 'node_modules');

  // Перевіряємо наявність папки node_modules
  if (!fs.existsSync(nodeModulesPath) || !fs.existsSync(path.join(nodeModulesPath, 'chalk'))) {
    console.log('\x1b[33mВстановлюються необхідні залежності для скрипту...\x1b[0m');
    
    try {
      // Запускаємо npm install в директорії scripts
      execSync('npm install', { 
        cwd: scriptsDir, 
        stdio: 'inherit' 
      });
      console.log('\x1b[32mЗалежності успішно встановлено!\x1b[0m');
  } catch (error) {
      console.error('\x1b[31mПомилка при встановленні залежностей: ' + error.message + '\x1b[0m');
      console.error('\x1b[33mСпробуйте встановити залежності вручну: npm run setup\x1b[0m');
      process.exit(1);
    }
  }
}

// Перевіряємо і встановлюємо залежності перед запуском
checkAndInstallDependencies();

// Шлях до модульної версії скрипту
const modulePath = path.join(__dirname, 'scripts', 'index.js');

// Перевірка наявності модульної версії скрипту
if (!fs.existsSync(modulePath)) {
  console.error('\x1b[31mПомилка: Не знайдено модульну версію скрипту: ' + modulePath + '\x1b[0m');
  console.error('\x1b[33mПереконайтесь, що структура каталогів не змінена і папка scripts/ існує.\x1b[0m');
  process.exit(1);
}

// Налаштовуємо виконуваність модульного скрипту
try {
  fs.chmodSync(modulePath, '755');
  } catch (error) {
  // Ігноруємо помилку, якщо встановлення прав не вдалося
}

// Запускаємо модульну версію скрипту
const script = spawn('node', [modulePath], {
      stdio: 'inherit',
      shell: true
    });
    
script.on('error', (error) => {
  console.error('\x1b[31mПомилка при запуску скрипту: ' + error.message + '\x1b[0m');
  process.exit(1);
});

script.on('close', (code) => {
  process.exit(code);
}); 