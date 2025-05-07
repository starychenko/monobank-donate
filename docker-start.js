#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Кольори для консолі
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Перевірка наявності Docker
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    // Додаткова перевірка, що Docker Engine працює
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Перевірка наявності Docker Compose
function checkDockerCompose() {
  try {
    execSync('docker-compose --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Запуск команди Docker Compose
function runDockerCompose(command, detached = false) {
  const args = command.split(' ');
  const options = detached ? ['-d'] : [];
  const fullCommand = ['docker-compose', ...args, ...options];
  
  console.log(`${colors.blue}Виконую: ${colors.cyan}${fullCommand.join(' ')}${colors.reset}`);
  
  const child = spawn(fullCommand[0], fullCommand.slice(1), { stdio: 'inherit' });
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}Команда завершилась з кодом ${code}${colors.reset}`);
    }
  });
  
  return child;
}

// Створення інтерактивного інтерфейсу
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Головне меню
function showMainMenu() {
  console.clear();
  console.log(`\n${colors.yellow}=== Monobank Donate - Docker Launcher ===${colors.reset}\n`);
  console.log(`${colors.magenta}Оберіть дію:${colors.reset}`);
  console.log(`${colors.green}1.${colors.reset} Запустити проект (розробка)`);
  console.log(`${colors.green}2.${colors.reset} Запустити проект (продакшн)`);
  console.log(`${colors.green}3.${colors.reset} Зупинити проект`);
  console.log(`${colors.green}4.${colors.reset} Перезапустити проект`);
  console.log(`${colors.green}5.${colors.reset} Дивитись логи`);
  console.log(`${colors.green}6.${colors.reset} Статус контейнерів`);
  console.log(`${colors.green}7.${colors.reset} Перебудувати проект`);
  console.log(`${colors.green}8.${colors.reset} Видалити всі контейнери та образи проекту`);
  console.log(`${colors.green}9.${colors.reset} Вийти\n`);
  
  rl.question(`${colors.yellow}Ваш вибір (1-9): ${colors.reset}`, (answer) => {
    handleMenuChoice(answer.trim());
  });
}

// Обробка вибору з меню
function handleMenuChoice(choice) {
  switch (choice) {
    case '1':
      startDevelopment();
      break;
    case '2':
      startProduction();
      break;
    case '3':
      stopContainers();
      break;
    case '4':
      restartContainers();
      break;
    case '5':
      showLogs();
      break;
    case '6':
      showStatus();
      break;
    case '7':
      rebuildProject();
      break;
    case '8':
      cleanupContainers();
      break;
    case '9':
      console.log(`${colors.green}Дякую за використання! До побачення.${colors.reset}`);
      rl.close();
      break;
    default:
      console.log(`${colors.red}Невідомий вибір. Спробуйте ще раз.${colors.reset}`);
      setTimeout(showMainMenu, 1500);
  }
}

// Функції для різних опцій
function startDevelopment() {
  console.log(`${colors.yellow}Запуск проекту в режимі розробки...${colors.reset}`);
  
  // Використовуємо шаблон без атрибуту version
  const devConfig = global._devComposeTemplate || `services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - VITE_API_URL=http://localhost:3001/api/parse-monobank
    container_name: monobank-donate-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - monobank-network
    volumes:
      - ./frontend:/app/frontend-src:ro
    environment:
      - NODE_ENV=development

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: monobank-donate-backend
    environment:
      - NODE_ENV=development
      - ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://frontend,http://frontend:80
    ports:
      - "3001:3001"
    networks:
      - monobank-network
    volumes:
      - ./backend:/app/backend-src:ro

networks:
  monobank-network:
    driver: bridge`;

  fs.writeFileSync('docker-compose.dev.yml', devConfig);
  
  const child = runDockerCompose('-f docker-compose.dev.yml up --build', true);
  
  console.log(`${colors.green}Проект запущено у режимі розробки!${colors.reset}`);
  console.log(`${colors.blue}Фронтенд доступний за адресою: ${colors.cyan}http://localhost${colors.reset}`);
  console.log(`${colors.blue}Бекенд доступний за адресою: ${colors.cyan}http://localhost:3001${colors.reset}`);
  console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
  
  rl.once('line', () => {
    showMainMenu();
  });
}

function startProduction() {
  console.log(`${colors.yellow}Запуск проекту в продакшн режимі...${colors.reset}`);
  
  const child = runDockerCompose('up --build', true);
  
  console.log(`${colors.green}Проект запущено у продакшн режимі!${colors.reset}`);
  console.log(`${colors.blue}Фронтенд доступний за адресою: ${colors.cyan}http://localhost${colors.reset}`);
  console.log(`${colors.blue}Бекенд доступний за адресою: ${colors.cyan}http://localhost:3001${colors.reset}`);
  console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
  
  rl.once('line', () => {
    showMainMenu();
  });
}

function stopContainers() {
  console.log(`${colors.yellow}Зупинка контейнерів...${colors.reset}`);
  
  try {
    // Перевіряємо наявність файлу docker-compose.dev.yml
    const devFileExists = fs.existsSync('docker-compose.dev.yml');
    
    if (devFileExists) {
      // Зупиняємо обидва варіанти
      execSync('docker-compose down', { stdio: 'inherit' });
      execSync('docker-compose -f docker-compose.dev.yml down', { stdio: 'inherit' });
      console.log(`${colors.green}Контейнери зупинено.${colors.reset}`);
    } else {
      // Зупиняємо тільки стандартний варіант
      execSync('docker-compose down', { stdio: 'inherit' });
      console.log(`${colors.green}Контейнери зупинено.${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}Помилка при зупинці контейнерів: ${error.message}${colors.reset}`);
  }
  
  console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
  
  rl.once('line', () => {
    showMainMenu();
  });
}

function restartContainers() {
  console.log(`${colors.yellow}Перезапуск контейнерів...${colors.reset}`);
  
  try {
    // Перевіряємо наявність файлу docker-compose.dev.yml
    const devFileExists = fs.existsSync('docker-compose.dev.yml');
    
    if (devFileExists) {
      // Запитуємо який варіант перезапустити
      rl.question(`${colors.yellow}Перезапустити розробку (1) чи продакшн (2)? ${colors.reset}`, (answer) => {
        if (answer.trim() === '1') {
          execSync('docker-compose -f docker-compose.dev.yml restart', { stdio: 'inherit' });
          console.log(`${colors.green}Контейнери розробки перезапущено.${colors.reset}`);
        } else {
          execSync('docker-compose restart', { stdio: 'inherit' });
          console.log(`${colors.green}Контейнери продакшн перезапущено.${colors.reset}`);
        }
        
        console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
        
        rl.once('line', () => {
          showMainMenu();
        });
      });
    } else {
      // Перезапускаємо стандартний варіант
      execSync('docker-compose restart', { stdio: 'inherit' });
      console.log(`${colors.green}Контейнери перезапущено.${colors.reset}`);
      
      console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
      
      rl.once('line', () => {
        showMainMenu();
      });
    }
  } catch (error) {
    console.log(`${colors.red}Помилка при перезапуску контейнерів: ${error.message}${colors.reset}`);
    
    console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
    
    rl.once('line', () => {
      showMainMenu();
    });
  }
}

function showLogs() {
  console.log(`${colors.yellow}Перегляд логів...${colors.reset}`);
  
  try {
    // Перевіряємо наявність файлу docker-compose.dev.yml
    const devFileExists = fs.existsSync('docker-compose.dev.yml');
    
    if (devFileExists) {
      // Запитуємо які логи показати
      rl.question(`${colors.yellow}Показати логи розробки (1) чи продакшн (2)? ${colors.reset}`, (answer) => {
        if (answer.trim() === '1') {
          console.log(`${colors.yellow}Логи режиму розробки (Ctrl+C для виходу):${colors.reset}\n`);
          const child = spawn('docker-compose', ['-f', 'docker-compose.dev.yml', 'logs', '-f'], { stdio: 'inherit' });
          
          child.on('close', () => {
            console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
            
            rl.once('line', () => {
              showMainMenu();
            });
          });
        } else {
          console.log(`${colors.yellow}Логи продакшн режиму (Ctrl+C для виходу):${colors.reset}\n`);
          const child = spawn('docker-compose', ['logs', '-f'], { stdio: 'inherit' });
          
          child.on('close', () => {
            console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
            
            rl.once('line', () => {
              showMainMenu();
            });
          });
        }
      });
    } else {
      // Показуємо логи стандартного варіанту
      console.log(`${colors.yellow}Логи (Ctrl+C для виходу):${colors.reset}\n`);
      const child = spawn('docker-compose', ['logs', '-f'], { stdio: 'inherit' });
      
      child.on('close', () => {
        console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
        
        rl.once('line', () => {
          showMainMenu();
        });
      });
    }
  } catch (error) {
    console.log(`${colors.red}Помилка при показі логів: ${error.message}${colors.reset}`);
    
    console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
    
    rl.once('line', () => {
      showMainMenu();
    });
  }
}

function showStatus() {
  console.log(`${colors.yellow}Статус контейнерів:${colors.reset}\n`);
  
  try {
    execSync('docker-compose ps', { stdio: 'inherit' });
    
    // Перевіряємо наявність файлу docker-compose.dev.yml
    const devFileExists = fs.existsSync('docker-compose.dev.yml');
    
    if (devFileExists) {
      console.log(`\n${colors.yellow}Статус контейнерів розробки:${colors.reset}\n`);
      execSync('docker-compose -f docker-compose.dev.yml ps', { stdio: 'inherit' });
    }
  } catch (error) {
    console.log(`${colors.red}Помилка при отриманні статусу: ${error.message}${colors.reset}`);
  }
  
  console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
  
  rl.once('line', () => {
    showMainMenu();
  });
}

function rebuildProject() {
  console.log(`${colors.yellow}Перебудова проекту...${colors.reset}`);
  
  try {
    // Перевіряємо наявність файлу docker-compose.dev.yml
    const devFileExists = fs.existsSync('docker-compose.dev.yml');
    
    if (devFileExists) {
      // Запитуємо який варіант перебудувати
      rl.question(`${colors.yellow}Перебудувати розробку (1) чи продакшн (2)? ${colors.reset}`, (answer) => {
        if (answer.trim() === '1') {
          execSync('docker-compose -f docker-compose.dev.yml build --no-cache', { stdio: 'inherit' });
          execSync('docker-compose -f docker-compose.dev.yml up -d', { stdio: 'inherit' });
          console.log(`${colors.green}Контейнери розробки перебудовано.${colors.reset}`);
        } else {
          execSync('docker-compose build --no-cache', { stdio: 'inherit' });
          execSync('docker-compose up -d', { stdio: 'inherit' });
          console.log(`${colors.green}Контейнери продакшн перебудовано.${colors.reset}`);
        }
        
        console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
        
        rl.once('line', () => {
          showMainMenu();
        });
      });
    } else {
      // Перебудовуємо стандартний варіант
      execSync('docker-compose build --no-cache', { stdio: 'inherit' });
      execSync('docker-compose up -d', { stdio: 'inherit' });
      console.log(`${colors.green}Контейнери перебудовано.${colors.reset}`);
      
      console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
      
      rl.once('line', () => {
        showMainMenu();
      });
    }
  } catch (error) {
    console.log(`${colors.red}Помилка при перебудові контейнерів: ${error.message}${colors.reset}`);
    
    console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
    
    rl.once('line', () => {
      showMainMenu();
    });
  }
}

function cleanupContainers() {
  console.log(`${colors.yellow}Видалення контейнерів та образів...${colors.reset}`);
  
  rl.question(`${colors.red}Ви впевнені? Всі контейнери та образи проекту будуть видалені (y/N): ${colors.reset}`, (answer) => {
    if (answer.trim().toLowerCase() === 'y') {
      try {
        execSync('docker-compose down -v --rmi all', { stdio: 'inherit' });
        
        // Перевіряємо наявність файлу docker-compose.dev.yml
        const devFileExists = fs.existsSync('docker-compose.dev.yml');
        
        if (devFileExists) {
          execSync('docker-compose -f docker-compose.dev.yml down -v --rmi all', { stdio: 'inherit' });
          // Видаляємо файл docker-compose.dev.yml
          fs.unlinkSync('docker-compose.dev.yml');
        }
        
        console.log(`${colors.green}Контейнери та образи видалено.${colors.reset}`);
      } catch (error) {
        console.log(`${colors.red}Помилка при видаленні: ${error.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.green}Операцію скасовано.${colors.reset}`);
    }
    
    console.log(`\n${colors.yellow}Натисніть Enter, щоб повернутися до меню...${colors.reset}`);
    
    rl.once('line', () => {
      showMainMenu();
    });
  });
}

// Перевірка системних вимог
function checkRequirements() {
  console.log(`${colors.yellow}Перевірка системних вимог...${colors.reset}`);
  
  const dockerInstalled = checkDocker();
  const dockerComposeInstalled = checkDockerCompose();
  
  if (!dockerInstalled) {
    console.log(`${colors.red}Docker не встановлено або не запущено.${colors.reset}`);
    console.log(`${colors.yellow}Переконайтеся, що:${colors.reset}`);
    console.log(`${colors.cyan}1. Docker Desktop встановлений${colors.reset}`);
    console.log(`${colors.cyan}2. Docker Desktop запущений (перевірте іконку в трей-меню)${colors.reset}`);
    console.log(`${colors.cyan}3. Перезапустіть Docker Desktop, якщо він не відповідає${colors.reset}`);
    process.exit(1);
  }
  
  if (!dockerComposeInstalled) {
    console.log(`${colors.red}Docker Compose не встановлено. Будь ласка, встановіть Docker Compose і спробуйте знову.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}Всі системні вимоги виконано!${colors.reset}`);
  
  // Перевірка наявності файлів Docker
  const requiredFiles = ['Dockerfile.frontend', 'Dockerfile.backend', 'docker-compose.yml'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.log(`${colors.red}Відсутні необхідні файли: ${missingFiles.join(', ')}${colors.reset}`);
    process.exit(1);
  }
  
  // Оновлюємо файл docker-compose.dev.yml без атрибуту version
  const devConfig = `services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - VITE_API_URL=http://localhost:3001/api/parse-monobank
    container_name: monobank-donate-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - monobank-network
    volumes:
      - ./frontend:/app/frontend-src:ro
    environment:
      - NODE_ENV=development

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: monobank-donate-backend
    environment:
      - NODE_ENV=development
      - ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://frontend,http://frontend:80
    ports:
      - "3001:3001"
    networks:
      - monobank-network
    volumes:
      - ./backend:/app/backend-src:ro

networks:
  monobank-network:
    driver: bridge`;

  // Зберігаємо оновлений шаблон для подальшого використання
  Object.defineProperty(global, '_devComposeTemplate', {
    value: devConfig,
    writable: false
  });
  
  showMainMenu();
}

// Запуск програми
checkRequirements(); 