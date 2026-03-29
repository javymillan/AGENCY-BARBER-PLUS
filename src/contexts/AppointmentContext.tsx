import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, Service } from '../types';

interface AppointmentContextType {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  totalAppointments: number;
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  fetchAppointments: (page?: number, size?: number) => Promise<void>;
  createAppointment: (appointment: Omit<Appointment, 'id' | 'created_at'>) => Promise<Appointment | null>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<Appointment | null>;
  deleteAppointment: (id: string) => Promise<boolean>;
  getAppointmentById: (id: string) => Appointment | undefined;
  getServiceById: (id: string) => Promise<Service | null>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments debe ser usado dentro de un AppointmentProvider');
  }
  return context;
};

interface AppointmentProviderProps {
  children: React.ReactNode;
}

export const AppointmentProvider: React.FC<AppointmentProviderProps> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAppointments, setTotalAppointments] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Función mejorada para cargar citas con información completa del servicio
  const fetchAppointments = useCallback(async (page: number = 1, size: number = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      
      // Consulta con JOIN explícito para obtener información completa del servicio
      const { data, error, count } = await supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (
            id,
            name,
            description,
            price,
            duration,
            active
          )
        `, { count: 'exact' })
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .range((page - 1) * size, page * size - 1);

      if (error) {
        console.error('Error en la consulta de citas:', error);
        throw error;
      }

      console.log('Citas cargadas con servicios:', data);

      setAppointments(data || []);
      setTotalAppointments(count || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las citas');
      console.error('Error al cargar las citas:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Función optimizada para crear citas con recarga inmediata
  const createAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'created_at'>) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Creando cita con datos:', appointment);

      // Crear la cita
      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert([{ ...appointment, created_at: new Date().toISOString() }])
        .select(`
          *,
          services:service_id (
            id,
            name,
            description,
            price,
            duration,
            active
          )
        `)
        .single();

      if (createError) {
        console.error('Error al crear cita:', createError);
        throw createError;
      }

      console.log('Cita creada exitosamente:', newAppointment);

      // Recargar todas las citas para asegurar consistencia
      await fetchAppointments(currentPage, pageSize);
      
      return newAppointment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cita');
      console.error('Error al crear la cita:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments, currentPage, pageSize]);

  // Función optimizada para actualizar citas
  const updateAppointment = useCallback(async (id: string, appointment: Partial<Appointment>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('appointments')
        .update(appointment)
        .eq('id', id)
        .select(`
          *,
          services:service_id (
            id,
            name,
            description,
            price,
            duration,
            active
          )
        `)
        .single();

      if (error) throw error;

      // Actualizar la lista local inmediatamente
      setAppointments(prevAppointments => 
        prevAppointments.map(app => app.id === id ? { ...app, ...data } : app)
      );

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la cita');
      console.error('Error al actualizar la cita:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función optimizada para eliminar citas
  const deleteAppointment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar la lista local inmediatamente
      setAppointments(prevAppointments => prevAppointments.filter(app => app.id !== id));
      setTotalAppointments(prev => prev - 1);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la cita');
      console.error('Error al eliminar la cita:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función optimizada para obtener una cita por ID
  const getAppointmentById = useCallback((id: string) => {
    return appointments.find(app => app.id === id);
  }, [appointments]);

  // Función optimizada para obtener un servicio por ID
  const getServiceById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error al obtener el servicio:', err);
      return null;
    }
  }, []);

  // Cargar citas al montar el componente
  useEffect(() => {
    fetchAppointments(1, pageSize);
  }, [fetchAppointments, pageSize]);

  // Memoizar el valor del contexto para evitar renderizaciones innecesarias
  const value = useMemo(() => ({
    appointments,
    loading,
    error,
    totalAppointments,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentById,
    getServiceById
  }), [
    appointments,
    loading,
    error,
    totalAppointments,
    currentPage,
    pageSize,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentById,
    getServiceById
  ]);

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};