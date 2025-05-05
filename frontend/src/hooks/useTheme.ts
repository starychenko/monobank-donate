import { useState, useEffect } from 'react';

type Theme = 'dark';

export function useTheme() {
  // Встановлюємо темну тему за замовчуванням
  const [theme] = useState<Theme>('dark');

  // Застосовуємо темну тему до документа
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Застосовуємо тільки темну тему
    root.classList.add('dark');
    root.classList.remove('light');
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Тепер toggleTheme не змінює тему, але повертаємо його для сумісності
  const toggleTheme = () => {
    // Нічого не робимо, тема завжди темна
  };

  return { theme, toggleTheme };
} 