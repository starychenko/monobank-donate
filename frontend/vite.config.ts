import fs from 'fs';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Перевіряємо наявність SSL-сертифікатів
let httpsOptions = undefined;
try {
  const sslKeyPath = 'C:\\GIT\\monobank-donate\\ssl\\server.key';
  const sslCertPath = 'C:\\GIT\\monobank-donate\\ssl\\server.crt';
  
  if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    httpsOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'невідома помилка';
  console.warn(`SSL сертифікати не знайдено: ${errorMessage}, HTTPS не буде використовуватись під час розробки`);
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Використовуємо HTTPS налаштування
    https: httpsOptions,
    proxy: {
      '/api': {
        target: httpsOptions ? 'https://localhost:3001' : 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()]
})