import fs from 'fs';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('C:\\GIT\\monobank-donate\\ssl\\server.key'),
      cert: fs.readFileSync('C:\\GIT\\monobank-donate\\ssl\\server.crt'),
    },
    proxy: {
      '/api': {
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
})
