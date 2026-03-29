import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Service } from '../types';

interface ServiceContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  createService: (service: Omit<Service, 'id' | 'created_at'>) => Promise<Service | null>;
  updateService: (id: string, service: Partial<Service>) => Promise<Service | null>;
  deleteService: (id: string) => Promise<boolean>;
  getServiceById: (id: string) => Service | undefined;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices debe ser usado dentro de un ServiceProvider');
  }
  return context;
};

interface ServiceProviderProps {
  children: React.ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .select('*, promotions:service_promotions(*)')
        .order('name', { ascending: true });

      if (error) throw error;

      setServices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los servicios');
      console.error('Error al cargar los servicios:', err);
    } finally {
      setLoading(false);
    }
  };

  const createService = async (service: Omit<Service, 'id' | 'created_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .insert([{ ...service, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      setServices([...services, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el servicio');
      console.error('Error al crear el servicio:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateService = async (id: string, service: Partial<Service>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .update(service)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setServices(services.map(svc => svc.id === id ? { ...svc, ...data } : svc));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el servicio');
      console.error('Error al actualizar el servicio:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(services.filter(svc => svc.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el servicio');
      console.error('Error al eliminar el servicio:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getServiceById = (id: string) => {
    return services.find(svc => svc.id === id);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const value = {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    getServiceById
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};