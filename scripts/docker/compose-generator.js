/**
 * Модуль для генерації docker-compose файлів
 */

const fs = require('fs');
const path = require('path');
const { colors, log } = require('../utils/colors');
const { rootDir, frontendDir, backendDir } = require('../utils/command-runner');
const { parseEnvFile } = require('../utils/fs-helpers');

/**
 * Генерує docker-compose файли на основі налаштувань
 * @param {Object} settings - Налаштування для генерації
 * @param {string} settings.frontendPort - Порт для frontend
 * @param {string} settings.backendPort - Порт для backend
 * @param {boolean} settings.useVolumeForFrontend - Використовувати том для frontend
 * @param {boolean} settings.useVolumeForBackend - Використовувати том для backend
 * @returns {Promise<boolean>} - Результат операції
 */
async function generateDockerComposeFiles(settings) {
  // Спершу зчитуємо всі змінні середовища з .env файлів, якщо вони існують
  const envVars = {
    frontend: {},
    backend: {}
  };
  
  try {
    // Зчитуємо змінні frontend .env
    const frontendEnvPath = path.join(frontendDir, '.env');
    if (fs.existsSync(frontendEnvPath)) {
      envVars.frontend = parseEnvFile(frontendEnvPath);
    }
    
    // Зчитуємо змінні backend .env
    const backendEnvPath = path.join(backendDir, '.env');
    if (fs.existsSync(backendEnvPath)) {
      envVars.backend = parseEnvFile(backendEnvPath);
    }
  } catch (error) {
    log.error(`Помилка при зчитуванні .env файлів: ${error.message}`);
    return false;
  }
  
  log.info('Налаштування змінних середовища для Docker...');
  
  // Формуємо змінні середовища для docker-compose в форматі yaml
  let frontendEnvConfig = `      - NODE_ENV=production\n`;
  let backendEnvConfig = `      - NODE_ENV=production\n`;
  let backendDevEnvConfig = `      - NODE_ENV=development\n`;
  
  // Додаємо ALLOWED_ORIGINS для backend, який містить frontendPort
  backendEnvConfig += `      - ALLOWED_ORIGINS=http://localhost,http://localhost:${settings.frontendPort}\n`;
  backendDevEnvConfig += `      - ALLOWED_ORIGINS=http://localhost,http://localhost:${settings.frontendPort},http://frontend,http://frontend:80\n`;
  
  // Підготовка змінних Vite як аргументів збірки для frontend
  // Ці змінні потрібно передати на етапі збірки, а не тільки як змінні середовища
  let frontendBuildArgs = `        - VITE_API_URL=http://localhost:${settings.backendPort}/api/parse-monobank`;
  let frontendProdBuildArgs = `        - VITE_API_URL=http://localhost:${settings.backendPort}/api/parse-monobank`;
  
  // Змінні середовища НЕ Vite для frontend
  let frontendNonViteEnvVars = '';
  
  // Додаємо решту змінних з .env файлів
  if (Object.keys(envVars.frontend).length > 0) {
    log.success(`Додаємо ${Object.keys(envVars.frontend).length} змінних frontend до Docker конфігурації`);
    
    const frontendEnvVarsToIgnore = ['NODE_ENV']; // Змінні, які вже додані або не потрібні
    
    for (const [key, value] of Object.entries(envVars.frontend)) {
      if (!frontendEnvVarsToIgnore.includes(key)) {
        // Якщо це Vite змінна, додаємо її як аргумент збірки
        if (key.startsWith('VITE_') && key !== 'VITE_API_URL') {
          frontendBuildArgs += `\n        - ${key}=${value}`;
          frontendProdBuildArgs += `\n        - ${key}=${value}`;
        } else {
          // Інші змінні додаємо як звичайні змінні середовища
          frontendNonViteEnvVars += `      - ${key}=${value}\n`;
        }
        
        // Також додаємо всі змінні до списку змінних середовища
        frontendEnvConfig += `      - ${key}=${value}\n`;
      }
    }
  }
  
  if (Object.keys(envVars.backend).length > 0) {
    log.success(`Додаємо ${Object.keys(envVars.backend).length} змінних backend до Docker конфігурації`);
    
    const backendEnvVarsToIgnore = ['NODE_ENV', 'ALLOWED_ORIGINS']; // Змінні, які вже додані
    
    for (const [key, value] of Object.entries(envVars.backend)) {
      if (!backendEnvVarsToIgnore.includes(key)) {
        backendEnvConfig += `      - ${key}=${value}\n`;
        backendDevEnvConfig += `      - ${key}=${value}\n`;
      }
    }
  }
  
  // Генеруємо docker-compose.yml для продакшну
  const productionConfig = `services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
${frontendProdBuildArgs}
    container_name: monobank-donate-frontend
    ports:
      - "${settings.frontendPort}:80"
    depends_on:
      - backend
    networks:
      - monobank-network
    restart: unless-stopped
    environment:
${frontendEnvConfig}

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: monobank-donate-backend
    environment:
${backendEnvConfig}
    ports:
      - "${settings.backendPort}:3001"
    networks:
      - monobank-network
    restart: unless-stopped

networks:
  monobank-network:
    driver: bridge`;

  fs.writeFileSync(path.join(rootDir, 'docker-compose.yml'), productionConfig);
  log.success('Файл docker-compose.yml оновлено');
  
  // Генеруємо docker-compose.dev.yml для розробки
  let devConfig = `services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
${frontendBuildArgs}
    container_name: monobank-donate-frontend
    ports:
      - "${settings.frontendPort}:80"
    depends_on:
      - backend
    networks:
      - monobank-network
    environment:
      - NODE_ENV=development`;
  
  // Додаємо змінні середовища frontend для dev-режиму
  if (frontendNonViteEnvVars !== '') {
    devConfig += `\n${frontendNonViteEnvVars}`;
  } else if (Object.keys(envVars.frontend).length > 0) {
    const frontendEnvVarsToIgnore = ['NODE_ENV']; // Змінні, які вже додані
    
    for (const [key, value] of Object.entries(envVars.frontend)) {
      if (!frontendEnvVarsToIgnore.includes(key) && !key.startsWith('VITE_')) {
        devConfig += `\n      - ${key}=${value}`;
      }
    }
  }
  
  // Додаємо том для frontend, якщо потрібно
  if (settings.useVolumeForFrontend) {
    devConfig += `
    volumes:
      - ./frontend:/app/frontend-src:ro`;
  }
  
  devConfig += `

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: monobank-donate-backend
    environment:
${backendDevEnvConfig}
    ports:
      - "${settings.backendPort}:3001"
    networks:
      - monobank-network`;
  
  // Додаємо том для backend, якщо потрібно
  if (settings.useVolumeForBackend) {
    devConfig += `
    volumes:
      - ./backend:/app/backend-src:ro`;
  }
  
  devConfig += `

networks:
  monobank-network:
    driver: bridge`;

  fs.writeFileSync(path.join(rootDir, 'docker-compose.dev.yml'), devConfig);
  log.success('Файл docker-compose.dev.yml оновлено');
  
  // Виводимо додаткову інформацію про змінні Vite
  log.info('Важливо: Змінні Vite (з префіксом VITE_) передані як аргументи збірки для правильної інтеграції у фронтенд.');
  
  return true;
}

module.exports = {
  generateDockerComposeFiles
}; 