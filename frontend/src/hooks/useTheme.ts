import { useEffect, useState } from 'react';

/**
 * Тип теми: світла або темна
 */
type Theme = 'dark' | 'light';

/**
 * Хук для керування темою оформлення додатку
 * 
 * Забезпечує переключення між світлою та темною темами з урахуванням:
 * - Збереження користувацького вибору в localStorage
 * - Автоматичного визначення системних налаштувань
 * - Застосування теми до документу за допомогою CSS-класів
 * 
 * @returns {Object} Об'єкт з поточною темою та функцією перемикання
 * @returns {Theme} .theme - Поточна активна тема ('dark' або 'light')
 * @returns {Function} .toggleTheme - Функція для перемикання між темами
 * 
 * @example
 * // Базове використання
 * const { theme, toggleTheme } = useTheme();
 * 
 * return (
 *   <div>
 *     <p>Поточна тема: {theme}</p>
 *     <button onClick={toggleTheme}>Змінити тему</button>
 *   </div>
 * );
 */
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