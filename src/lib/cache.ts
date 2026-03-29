/**
 * Sistema de caché para reducir consultas repetitivas a la base de datos
 */

type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos por defecto

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  /**
   * Guarda un valor en la caché
   * @param key Clave única para identificar el valor
   * @param data Datos a almacenar
   * @param ttl Tiempo de vida en milisegundos (opcional)
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;
    
    this.cache.set(key, {
      data,
      timestamp,
      expiresAt
    });
  }

  /**
   * Obtiene un valor de la caché
   * @param key Clave del valor a obtener
   * @returns El valor almacenado o null si no existe o ha expirado
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) return null;
    
    // Verificar si el item ha expirado
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Elimina un valor específico de la caché
   * @param key Clave del valor a eliminar
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpia toda la caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Elimina todos los elementos expirados de la caché
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = Cache.getInstance();