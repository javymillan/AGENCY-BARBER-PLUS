import { supabase } from './supabase';
import { cacheService } from './cache';

interface SyncManager {
  isActive: boolean;
  subscriptions: Map<string, any>;
  callbacks: Map<string, Function[]>;
}

class RealTimeSyncManager {
  private static instance: RealTimeSyncManager;
  private manager: SyncManager;

  private constructor() {
    this.manager = {
      isActive: false,
      subscriptions: new Map(),
      callbacks: new Map()
    };
  }

  public static getInstance(): RealTimeSyncManager {
    if (!RealTimeSyncManager.instance) {
      RealTimeSyncManager.instance = new RealTimeSyncManager();
    }
    return RealTimeSyncManager.instance;
  }

  /**
   * Suscribirse a cambios en tiempo real de una tabla específica
   */
  public subscribe(
    table: string,
    filter: string | null,
    callback: (payload: any) => void
  ): string {
    const subscriptionId = `${table}_${filter || 'all'}_${Date.now()}`;
    
    // Agregar callback
    if (!this.manager.callbacks.has(table)) {
      this.manager.callbacks.set(table, []);
    }
    this.manager.callbacks.get(table)!.push(callback);

    // Crear suscripción si no existe
    if (!this.manager.subscriptions.has(table)) {
      const channel = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: filter || undefined
          },
          (payload) => {
            console.log(`Real-time change in ${table}:`, payload);
            
            // Invalidar caché relacionado
            this.invalidateRelatedCache(table, payload);
            
            // Ejecutar todos los callbacks para esta tabla
            const callbacks = this.manager.callbacks.get(table) || [];
            callbacks.forEach(cb => cb(payload));
          }
        )
        .subscribe();

      this.manager.subscriptions.set(table, channel);
    }

    this.manager.isActive = true;
    return subscriptionId;
  }

  /**
   * Desuscribirse de cambios en tiempo real
   */
  public unsubscribe(subscriptionId: string): void {
    // Implementar lógica de desuscripción específica si es necesario
    // Por ahora, mantenemos las suscripciones activas para simplicidad
  }

  /**
   * Desuscribirse de todos los cambios
   */
  public unsubscribeAll(): void {
    this.manager.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    
    this.manager.subscriptions.clear();
    this.manager.callbacks.clear();
    this.manager.isActive = false;
  }

  /**
   * Invalidar caché relacionado cuando hay cambios
   */
  private invalidateRelatedCache(table: string, payload: any): void {
    switch (table) {
      case 'appointments':
        // Invalidar caché de horarios disponibles para la fecha afectada
        if (payload.new?.date || payload.old?.date) {
          const date = payload.new?.date || payload.old?.date;
          cacheService.delete(`available_slots_${date}_*`);
          cacheService.delete(`appointments_${date}_*`);
        }
        break;
        
      case 'business_hours':
        // Invalidar caché de horarios de negocio
        cacheService.delete('business_hours_*');
        break;
        
      case 'blocked_times':
        // Invalidar caché de horarios bloqueados
        if (payload.new?.date || payload.old?.date) {
          const date = payload.new?.date || payload.old?.date;
          cacheService.delete(`blocked_times_${date}_*`);
        }
        break;
        
      case 'booking_rules':
        // Invalidar caché de reglas de reserva
        cacheService.delete('booking_rules_*');
        break;
    }
  }

  /**
   * Verificar si el sincronizador está activo
   */
  public isActive(): boolean {
    return this.manager.isActive;
  }

  /**
   * Forzar sincronización manual
   */
  public async forcSync(table: string, filter?: string): Promise<void> {
    try {
      // Limpiar caché relacionado
      this.invalidateRelatedCache(table, {});
      
      // Notificar a los callbacks que deben refrescar
      const callbacks = this.manager.callbacks.get(table) || [];
      callbacks.forEach(cb => cb({ event: 'FORCE_REFRESH' }));
      
    } catch (error) {
      console.error('Error in force sync:', error);
    }
  }
}

export const realTimeSyncManager = RealTimeSyncManager.getInstance();

/**
 * Hook para facilitar el uso del sincronizador en componentes React
 */
export function useRealTimeSync(
  table: string,
  filter: string | null,
  callback: (payload: any) => void
) {
  const subscriptionId = realTimeSyncManager.subscribe(table, filter, callback);
  
  return {
    subscriptionId,
    unsubscribe: () => realTimeSyncManager.unsubscribe(subscriptionId),
    forceSync: () => realTimeSyncManager.forcSync(table, filter || undefined)
  };
}