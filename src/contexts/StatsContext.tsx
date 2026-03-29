import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { BusinessStats, PopularService, AppointmentsByDay } from '../types/nuevas-funcionalidades';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface StatsContextType {
  stats: BusinessStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: (startDate?: Date, endDate?: Date) => Promise<BusinessStats | null>;
  getRevenueByPeriod: (period: 'day' | 'week' | 'month' | 'year') => Promise<number>;
  getPopularServices: (limit?: number) => Promise<PopularService[]>;
  getAppointmentsByDay: () => Promise<AppointmentsByDay[]>;
  getClientRetentionRate: () => Promise<number>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats debe ser usado dentro de un StatsProvider');
  }
  return context;
};

interface StatsProviderProps {
  children: React.ReactNode;
}

export const StatsProvider: React.FC<StatsProviderProps> = ({ children }) => {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener estadísticas generales
  const fetchStats = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      // Establecer fechas por defecto (mes actual)
      const start = startDate ? startDate : startOfMonth(new Date());
      const end = endDate ? endDate : endOfMonth(new Date());
      
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      
      // Obtener total de citas
      const { count: totalAppointments, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('date', startStr)
        .lte('date', endStr);

      if (countError) throw countError;
      
      // Obtener citas completadas
      const { count: completedAppointments, error: completedError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('date', startStr)
        .lte('date', endStr);

      if (completedError) throw completedError;
      
      // Obtener citas pendientes
      const { count: pendingAppointments, error: pendingError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('date', startStr)
        .lte('date', endStr);

      if (pendingError) throw pendingError;
      
      // Obtener ingresos totales
      const { data: revenueData, error: revenueError } = await supabase
        .from('appointments')
        .select(`
          id,
          services:service_id (price)
        `)
        .eq('status', 'completed')
        .gte('date', startStr)
        .lte('date', endStr);

      if (revenueError) throw revenueError;
      
      const totalRevenue = revenueData?.reduce((sum, appointment) => {
        return sum + (appointment.services?.price || 0);
      }, 0) || 0;
      
      // Obtener servicios populares
      const popularServices = await getPopularServices(5);
      
      // Obtener citas por día de la semana
      const appointmentsByDay = await getAppointmentsByDay();
      
      // Calcular tasa de retención de clientes
      const clientRetentionRate = await getClientRetentionRate();
      
      // Crear objeto de estadísticas
      const businessStats: BusinessStats = {
        total_appointments: totalAppointments || 0,
        completed_appointments: completedAppointments || 0,
        pending_appointments: pendingAppointments || 0,
        total_revenue: totalRevenue,
        popular_services: popularServices,
        appointments_by_day: appointmentsByDay,
        client_retention_rate: clientRetentionRate
      };
      
      setStats(businessStats);
      return businessStats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      console.error('Error al cargar estadísticas:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener ingresos por período
  const getRevenueByPeriod = useCallback(async (period: 'day' | 'week' | 'month' | 'year') => {
    try {
      let startDate: Date;
      const now = new Date();
      
      // Determinar fecha de inicio según el período
      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          const day = now.getDay();
          startDate = new Date(now.setDate(now.getDate() - day));
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = startOfMonth(now);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = startOfMonth(now);
      }
      
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(now, 'yyyy-MM-dd');
      
      // Obtener ingresos para el período
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          services:service_id (price)
        `)
        .eq('status', 'completed')
        .gte('date', startStr)
        .lte('date', endStr);

      if (error) throw error;
      
      const totalRevenue = data?.reduce((sum, appointment) => {
        return sum + (appointment.services?.price || 0);
      }, 0) || 0;
      
      return totalRevenue;
    } catch (err) {
      console.error(`Error al obtener ingresos por ${period}:`, err);
      return 0;
    }
  }, []);

  // Obtener servicios más populares
  const getPopularServices = useCallback(async (limit: number = 5) => {
    try {
      // Obtener todas las citas con sus servicios
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          service_id,
          services:service_id (id, name)
        `)
        .eq('status', 'completed');

      if (error) throw error;
      
      // Contar ocurrencias de cada servicio
      const serviceCounts: Record<string, { id: string, name: string, count: number }> = {};
      
      data?.forEach(appointment => {
        if (appointment.service_id && appointment.services) {
          const serviceId = appointment.service_id;
          if (!serviceCounts[serviceId]) {
            serviceCounts[serviceId] = {
              id: serviceId,
              name: appointment.services.name,
              count: 0
            };
          }
          serviceCounts[serviceId].count += 1;
        }
      });
      
      // Convertir a array y ordenar por popularidad
      const servicesArray = Object.values(serviceCounts);
      const totalAppointments = servicesArray.reduce((sum, service) => sum + service.count, 0);
      
      const popularServices: PopularService[] = servicesArray
        .map(service => ({
          service_id: service.id,
          service_name: service.name,
          count: service.count,
          percentage: totalAppointments > 0 ? (service.count / totalAppointments) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      return popularServices;
    } catch (err) {
      console.error('Error al obtener servicios populares:', err);
      return [];
    }
  }, []);

  // Obtener citas por día de la semana
  const getAppointmentsByDay = useCallback(async () => {
    try {
      // Obtener todas las citas
      const { data, error } = await supabase
        .from('appointments')
        .select('date');

      if (error) throw error;
      
      // Inicializar contador para cada día de la semana (0-6)
      const dayCount: number[] = [0, 0, 0, 0, 0, 0, 0];
      
      // Contar citas por día de la semana
      data?.forEach(appointment => {
        const date = new Date(appointment.date);
        const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
        dayCount[dayOfWeek] += 1;
      });
      
      // Crear array de resultados
      const appointmentsByDay: AppointmentsByDay[] = dayCount.map((count, index) => ({
        day_of_week: index,
        count: count
      }));
      
      return appointmentsByDay;
    } catch (err) {
      console.error('Error al obtener citas por día:', err);
      return [];
    }
  }, []);

  // Calcular tasa de retención de clientes - CORREGIDO
  const getClientRetentionRate = useCallback(async () => {
    try {
      // Obtener todas las citas ordenadas por fecha
      const { data, error } = await supabase
        .from('appointments')
        .select('client_phone, date, created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return 0;
      }
      
      // Agrupar citas por cliente
      const clientAppointments: Record<string, Array<{date: string, created_at: string}>> = {};
      
      data.forEach(appointment => {
        const clientPhone = appointment.client_phone;
        if (!clientAppointments[clientPhone]) {
          clientAppointments[clientPhone] = [];
        }
        clientAppointments[clientPhone].push({
          date: appointment.date,
          created_at: appointment.created_at
        });
      });
      
      // Contar clientes únicos y clientes que regresaron
      const totalUniqueClients = Object.keys(clientAppointments).length;
      let returningClients = 0;
      
      // Un cliente que regresa es aquel que tiene más de una cita
      Object.values(clientAppointments).forEach(appointments => {
        if (appointments.length > 1) {
          returningClients++;
        }
      });
      
      // Calcular tasa de retención como porcentaje
      const retentionRate = totalUniqueClients > 0 
        ? (returningClients / totalUniqueClients) 
        : 0;
      
      // Asegurar que el resultado esté entre 0 y 1 (0% a 100%)
      return Math.min(Math.max(retentionRate, 0), 1);
      
    } catch (err) {
      console.error('Error al calcular tasa de retención:', err);
      return 0;
    }
  }, []);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Memoizar el valor del contexto para evitar renderizaciones innecesarias
  const value = useMemo(() => ({
    stats,
    loading,
    error,
    fetchStats,
    getRevenueByPeriod,
    getPopularServices,
    getAppointmentsByDay,
    getClientRetentionRate
  }), [
    stats,
    loading,
    error,
    fetchStats,
    getRevenueByPeriod,
    getPopularServices,
    getAppointmentsByDay,
    getClientRetentionRate
  ]);

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
};