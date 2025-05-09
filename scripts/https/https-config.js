/**
 * Модуль для конфігурації HTTPS у різних компонентах проекту
 */

const fs = require('fs');
const path = require('path');
const { colors, log } = require('../utils/colors');
const { rootDir, frontendDir, backendDir } = require('../utils/command-runner');
const { updateEnvValue } = require('../utils/fs-helpers');
const { generateDockerComposeFiles } = require('../docker/compose-generator');

/**
 * Оновлює змінні середовища для підтримки HTTPS
 * @param {string} domain - Домен для HTTPS
 * @param {Object} certPaths - Шляхи до SSL-сертифікатів
 * @param {string} certPaths.keyPath - Шлях до приватного ключа
 * @param {string} certPaths.certPath - Шлях до сертифікату
 * @returns {boolean} - Результат операції
 */
function updateEnvFilesForHttps(domain, certPaths) {
  try {
    // Оновлюємо frontend .env
    const frontendEnvPath = path.join(frontendDir, '.env');
    if (fs.existsSync(frontendEnvPath)) {
      updateEnvValue(frontendEnvPath, 'VITE_USE_HTTPS', 'true');
      updateEnvValue(frontendEnvPath, 'VITE_DOMAIN', domain);
      updateEnvValue(frontendEnvPath, 'VITE_API_URL', `https://${domain}:3001/api/parse-monobank`);
      log.success(`Frontend .env файл оновлено для підтримки HTTPS (${domain})`);
    } else {
      log.error('Frontend .env файл не знайдено');
      return false;
    }

    // Оновлюємо backend .env
    const backendEnvPath = path.join(backendDir, '.env');
    if (fs.existsSync(backendEnvPath)) {
      updateEnvValue(backendEnvPath, 'USE_HTTPS', 'true');
      updateEnvValue(backendEnvPath, 'SSL_KEY_PATH', certPaths.keyPath);
      updateEnvValue(backendEnvPath, 'SSL_CERT_PATH', certPaths.certPath);
      updateEnvValue(backendEnvPath, 'DOMAIN', domain);
      
      // Оновлюємо CORS для HTTPS
      updateEnvValue(
        backendEnvPath, 
        'ALLOWED_ORIGINS', 
        `https://${domain},https://${domain}:80,https://${domain}:443,https://localhost,https://localhost:80,https://localhost:443,https://localhost:5173`
      );
      
      log.success(`Backend .env файл оновлено для підтримки HTTPS (${domain})`);
    } else {
      log.error('Backend .env файл не знайдено');
      return false;
    }

    return true;
  } catch (error) {
    log.error(`Помилка при оновленні .env файлів для HTTPS: ${error.message}`);
    return false;
  }
}

/**
 * Оновлює конфігурацію Docker для підтримки HTTPS
 * @param {string} domain - Домен для HTTPS
 * @param {Object} certPaths - Шляхи до SSL-сертифікатів
 * @returns {Promise<boolean>} - Результат операції
 */
async function updateDockerForHttps(domain, certPaths) {
  try {
    // Генеруємо Docker Compose файли з підтримкою HTTPS
    await generateDockerComposeFiles({
      frontendPort: '443',
      backendPort: '3001',
      useVolumeForFrontend: false,
      useVolumeForBackend: false,
      useHttps: true,
      domain,
      sslCertPath: certPaths.certPath,
      sslKeyPath: certPaths.keyPath
    });

    log.success('Docker конфігурацію оновлено для підтримки HTTPS');
    return true;
  } catch (error) {
    log.error(`Помилка при оновленні Docker конфігурації для HTTPS: ${error.message}`);
    return false;
  }
}

/**
 * Оновлює конфігурацію Nginx для підтримки HTTPS
 * @param {string} domain - Домен для HTTPS
 * @returns {boolean} - Результат операції
 */
function updateNginxConfig(domain) {
  try {
    const nginxConfigPath = path.join(frontendDir, 'nginx.conf');
    const httpsNginxConfig = `# Конфігурація Nginx для Monobank Donate з підтримкою HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    
    # Перенаправлення з HTTP на HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};
    
    # SSL-сертифікати
    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    
    # Оптимізація SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Основні налаштування
    root /usr/share/nginx/html;
    index index.html;
    
    # Заголовки безпеки
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # Кешування статичних файлів
    location ~* \\.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff2|woff)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # Service Worker повинен обслуговуватися з кореня домену
    location = /sw.js {
        add_header Cache-Control "no-cache";
        expires off;
    }
    
    # Обробка запитів до API
    location /api/ {
        proxy_pass https://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Всі інші запити направляємо на index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}`;

    fs.writeFileSync(nginxConfigPath, httpsNginxConfig);
    log.success(`Файл конфігурації Nginx оновлено для домену ${domain} з підтримкою HTTPS`);
    return true;
  } catch (error) {
    log.error(`Помилка при оновленні конфігурації Nginx: ${error.message}`);
    return false;
  }
}

/**
 * Оновлює Vite конфігурацію для підтримки HTTPS
 * @param {Object} certPaths - Шляхи до SSL-сертифікатів
 * @returns {boolean} - Результат операції
 */
function updateViteConfig(certPaths) {
  try {
    const viteConfigPath = path.join(frontendDir, 'vite.config.ts');
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Перевіряємо, чи вже є конфігурація HTTPS
    if (viteConfig.includes('https: {')) {
      log.info('Vite конфігурація вже містить налаштування HTTPS');
      return true;
    }
    
    // Додаємо конфігурацію HTTPS
    const httpsConfig = `
  server: {
    https: {
      key: fs.readFileSync('${certPaths.keyPath.replace(/\\/g, '\\\\')}'),
      cert: fs.readFileSync('${certPaths.certPath.replace(/\\/g, '\\\\')}'),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },`;
    
    // Знаходимо позицію після defineConfig({
    const configStartIndex = viteConfig.indexOf('defineConfig({') + 'defineConfig({'.length;
    const updatedConfig = viteConfig.slice(0, configStartIndex) + httpsConfig + viteConfig.slice(configStartIndex);
    
    // Додаємо імпорт fs, якщо його немає
    let finalConfig = updatedConfig;
    if (!finalConfig.includes('import fs from ')) {
      const importStatement = "import fs from 'fs';\n";
      finalConfig = importStatement + finalConfig;
    }
    
    fs.writeFileSync(viteConfigPath, finalConfig);
    log.success('Vite конфігурацію оновлено для підтримки HTTPS');
    return true;
  } catch (error) {
    log.error(`Помилка при оновленні Vite конфігурації: ${error.message}`);
    return false;
  }
}

/**
 * Оновлює конфігурацію проекту для підтримки HTTPS
 * @param {Object} rl - Інтерфейс readline
 * @param {string} domain - Домен для HTTPS
 * @param {Object} certPaths - Шляхи до SSL-сертифікатів
 * @returns {Promise<boolean>} - Результат операції
 */
async function configureHttps(rl, domain, certPaths) {
  log.title('=== Налаштування HTTPS ===');
  
  // Оновлюємо .env файли
  if (!updateEnvFilesForHttps(domain, certPaths)) {
    return false;
  }
  
  // Оновлюємо Docker конфігурацію
  if (!await updateDockerForHttps(domain, certPaths)) {
    return false;
  }
  
  // Оновлюємо Nginx конфігурацію
  if (!updateNginxConfig(domain)) {
    return false;
  }
  
  // Оновлюємо Vite конфігурацію
  if (!updateViteConfig(certPaths)) {
    return false;
  }
  
  log.success('HTTPS налаштування завершено успішно!');
  return true;
}

module.exports = {
  updateEnvFilesForHttps,
  updateDockerForHttps,
  updateNginxConfig,
  updateViteConfig,
  configureHttps
}; 