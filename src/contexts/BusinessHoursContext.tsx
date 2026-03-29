import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BusinessHours, BlockedTime } from '../types';

interface BusinessHoursContextType {
  businessHours: BusinessHours[];
  blockedTimes: BlockedTime[];
  loading: boolean;
  error: string | null;
  fetchBusinessHours: () => Promise<void>;
  fetchBlockedTimes: () => Promise<void>;
  updateBusinessHours: (id: string, hours: Partial<BusinessHours>) => Promise<BusinessHours | null>;
  createBlockedTime: (blockedTime: Omit<BlockedTime, 'id'>) => Promise<BlockedTime | null>;
  deleteBlockedTime: (id: string) => Promise<boolean>;
  getBusinessHoursByDay: (dayOfWeek: number) => BusinessHours | undefined;
}

const BusinessHoursContext = createContext<BusinessHoursContextType | undefined>(undefined);

export const useBusinessHours = () => {
  const context = useContext(BusinessHoursContext);
  if (!context) {
    throw new Error('useBusinessHours debe ser usado dentro de un BusinessHoursProvider');
  }
  return context;
};

interface BusinessHoursProviderProps {
  children: React.ReactNode;
}

export const BusinessHoursProvider: React.FC<BusinessHoursProviderProps> = ({ children }) => {
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinessHours = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      setBusinessHours(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los horarios');
      console.error('Error al cargar los horarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedTimes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      setBlockedTimes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los tiempos bloqueados');
      console.error('Error al cargar los tiempos bloqueados:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessHours = async (id: string, hours: Partial<BusinessHours>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('business_hours')
        .update(hours)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBusinessHours(businessHours.map(hour => hour.id === id ? { ...hour, ...data } : hour));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el horario');
      console.error('Error al actualizar el horario:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createBlockedTime = async (blockedTime: Omit<BlockedTime, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('blocked_times')
        .insert([blockedTime])
        .select()
        .single();

      if (error) throw error;

      setBlockedTimes([...blockedTimes, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el tiempo bloqueado');
      console.error('Error al crear el tiempo bloqueado:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteBlockedTime = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBlockedTimes(blockedTimes.filter(time => time.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el tiempo bloqueado');
      console.error('Error al eliminar el tiempo bloqueado:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getBusinessHoursByDay = (dayOfWeek: number) => {
    return businessHours.find(hour => hour.day_of_week === dayOfWeek);
  };

  useEffect(() => {
    fetchBusinessHours();
    fetchBlockedTimes();
  }, []);

  const value = {
    businessHours,
    blockedTimes,
    loading,
    error,
    fetchBusinessHours,
    fetchBlockedTimes,
    updateBusinessHours,
    createBlockedTime,
    deleteBlockedTime,
    getBusinessHoursByDay
  };

  return (
    <BusinessHoursContext.Provider value={value}>
      {children}
    </BusinessHoursContext.Provider>
  );
};