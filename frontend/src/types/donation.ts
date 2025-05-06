/**
 * Інтерфейс для даних про збір коштів
 */
export interface FundData {
  title: string | null;
  collected: string | null;
  target: string | null;
  description?: string;
} 