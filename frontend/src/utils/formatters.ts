/**
 * Функції для форматування та обробки числових значень
 */

/**
 * Очищає рядок від нецифрових символів, залишаючи числа та крапку
 * @param value - Рядок для очищення
 * @returns Числове значення або 0, якщо неможливо перетворити
 */
export const cleanValue = (value: string | null): number => {
  if (!value) return 0;
  // Залишаємо тільки цифри і крапку, потім перетворюємо в число
  const numericString = value.replace(/[^\d.]/g, '');
  return parseFloat(numericString) || 0;
};

/**
 * Розраховує відсоток прогресу збору
 * @param collected - Зібрана сума
 * @param target - Цільова сума
 * @returns Відсоток виконання (0-100)
 */
export const getProgress = (collected: string | null, target: string | null): number => {
  const collectedValue = cleanValue(collected);
  const targetValue = cleanValue(target);
  
  if (!collectedValue || !targetValue) return 0;
  return Math.min((collectedValue / targetValue) * 100, 100);
}; 