/**
 * Модуль для генерації та управління SSL-сертифікатами
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { colors, log } = require('../utils/colors');
const { rootDir } = require('../utils/command-runner');
const { ensureDirectoryExists, fileExists } = require('../utils/fs-helpers');

// Додаємо глобальну змінну для зберігання шляху до OpenSSL
let globalOpenSSLPath = null;

/**
 * Перевіряє наявність OpenSSL в системі
 * @returns {boolean} - Чи доступний OpenSSL
 */
function checkOpenSSL() {
  try {
    // Спробуємо запустити напряму
    execSync('openssl version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    // У Windows перевіряємо стандартні шляхи встановлення
    if (process.platform === 'win32') {
      const possiblePaths = [
        'C:\\Program Files\\OpenSSL-Win64\\bin\\openssl.exe',
        'C:\\Program Files\\OpenSSL-Win64\\openssl.exe',
        'C:\\Program Files (x86)\\OpenSSL-Win64\\bin\\openssl.exe',
        'C:\\Program Files (x86)\\OpenSSL-Win64\\openssl.exe',
        'C:\\OpenSSL-Win64\\bin\\openssl.exe',
        'C:\\OpenSSL-Win64\\openssl.exe'
      ];
      
      for (const opensslPath of possiblePaths) {
        try {
          if (fs.existsSync(opensslPath)) {
            // Зберігаємо знайдений шлях для подальшого використання
            globalOpenSSLPath = opensslPath;
            execSync(`"${opensslPath}" version`, { stdio: 'ignore' });
            log.info(`Знайдено OpenSSL у шляху: ${opensslPath}`);
            return true;
          }
        } catch (e) {
          // Ігноруємо помилку, перевіряємо наступний шлях
        }
      }
    }
    
    return false;
  }
}

/**
 * Генерує самопідписані SSL-сертифікати
 * @param {string} domain - Домен для сертифікату
 * @param {string} certDir - Директорія для збереження сертифікатів
 * @returns {Object} - Результат операції та шляхи до сертифікатів
 */
function generateSelfSignedCertificates(domain, certDir) {
  try {
    if (!checkOpenSSL()) {
      log.error('Не знайдено OpenSSL. Будь ласка, встановіть його для генерації сертифікатів.');
      return { success: false };
    }

    // Створюємо директорію для сертифікатів, якщо вона не існує
    ensureDirectoryExists(certDir);

    const keyPath = path.join(certDir, 'server.key');
    const certPath = path.join(certDir, 'server.crt');
    const configPath = path.join(certDir, 'openssl.cnf');

    // Створюємо конфігураційний файл для OpenSSL
    const opensslConfig = `[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = UA
ST = Ukraine
L = Kyiv
O = Monobank Donate
OU = Development
CN = ${domain}

[v3_req]
keyUsage = critical, digitalSignature, keyAgreement
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${domain}
DNS.2 = *.${domain}
DNS.3 = localhost`;

    fs.writeFileSync(configPath, opensslConfig);

    // Визначаємо команду OpenSSL (з глобальним шляхом, якщо він знайдений)
    const opensslCmd = globalOpenSSLPath ? `"${globalOpenSSLPath}"` : 'openssl';

    // Створюємо приватний ключ
    execSync(`${opensslCmd} genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });

    // Створюємо сертифікат підписаний цим ключем
    execSync(`${opensslCmd} req -new -x509 -key "${keyPath}" -out "${certPath}" -days 825 -config "${configPath}"`, { stdio: 'inherit' });

    log.success(`SSL-сертифікати згенеровано для домену ${domain}`);
    log.info(`Шлях до приватного ключа: ${keyPath}`);
    log.info(`Шлях до сертифікату: ${certPath}`);

    return {
      success: true,
      keyPath,
      certPath
    };
  } catch (error) {
    log.error(`Помилка при генерації SSL-сертифікатів: ${error.message}`);
    return { success: false };
  }
}

/**
 * Перевіряє наявність SSL-сертифікатів
 * @param {string} certDir - Директорія з сертифікатами
 * @returns {boolean} - Чи існують сертифікати
 */
function checkCertificatesExist(certDir) {
  const keyPath = path.join(certDir, 'server.key');
  const certPath = path.join(certDir, 'server.crt');
  
  return fileExists(keyPath) && fileExists(certPath);
}

/**
 * Отримує шляхи до SSL-сертифікатів
 * @param {string} certDir - Директорія з сертифікатами
 * @returns {Object} - Шляхи до сертифікатів
 */
function getCertificatePaths(certDir) {
  const keyPath = path.join(certDir, 'server.key');
  const certPath = path.join(certDir, 'server.crt');
  
  return {
    keyPath,
    certPath
  };
}

/**
 * Генерує або використовує існуючі SSL-сертифікати
 * @param {Object} rl - Інтерфейс readline
 * @param {string} domain - Домен для сертифікату
 * @returns {Promise<Object>} - Результат операції та шляхи до сертифікатів
 */
async function setupSSLCertificates(rl, domain) {
  const certDir = path.join(rootDir, 'ssl');
  
  // Перевіряємо наявність сертифікатів
  if (checkCertificatesExist(certDir)) {
    log.info('SSL-сертифікати вже існують');
    
    const regenerate = await new Promise((resolve) => {
      rl.question(`${colors.yellow}Бажаєте згенерувати нові сертифікати для домену ${domain}? (y/n) ${colors.reset}`, (answer) => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
    
    if (!regenerate) {
      log.info('Використовуємо існуючі сертифікати');
      return {
        success: true,
        ...getCertificatePaths(certDir)
      };
    }
  }
  
  // Генеруємо нові сертифікати
  log.info(`Генерація SSL-сертифікатів для домену ${domain}...`);
  return generateSelfSignedCertificates(domain, certDir);
}

module.exports = {
  checkOpenSSL,
  generateSelfSignedCertificates,
  checkCertificatesExist,
  getCertificatePaths,
  setupSSLCertificates
}; 