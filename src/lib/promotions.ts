import { Service } from '../types';

export interface PriceResult {
  originalPrice: number;
  finalPrice: number;
  discountApplied: {
    name: string;
    amount: number;
    type: 'fixed' | 'percentage';
  } | null;
}

/**
 * Calcula el precio de un servicio considerando posibles promociones
 * Por ahora es una implementación básica, pero puede extenderse para
 * consultar promociones activas en la base de datos.
 */
export function calculateServicePrice(service: Service, date: Date = new Date()): PriceResult {
  // En una versión completa, aquí buscaríamos promociones filtrando por fecha, día de la semana, etc.
  
  return {
    originalPrice: service.price,
    finalPrice: service.price,
    discountApplied: null
  };
}
