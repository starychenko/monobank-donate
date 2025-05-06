/**
 * Константи для роботи з API
 */

// URL банки Monobank
export const JAR_URL = import.meta.env.VITE_MONOBANK_JAR_URL || 'https://send.monobank.ua/jar/58vdbegH3T';

// Інтервал оновлення даних (мс)
export const UPDATE_INTERVAL = Number(import.meta.env.VITE_UPDATE_INTERVAL) || 15000;

// URL API бекенду
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/parse-monobank'; 