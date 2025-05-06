import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  // Перевіряємо збережену тему або використовуємо темну за замовчуванням
  const getSavedTheme = (): Theme => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    // Перевіряємо системні налаштування
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<Theme>('dark'); // Початкове значення для SSR

  // Завантажуємо тему при першому рендері
  useEffect(() => {
    setTheme(getSavedTheme());
  }, []);

  // Застосовуємо тему до документа
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Функція для перемикання теми
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
} 