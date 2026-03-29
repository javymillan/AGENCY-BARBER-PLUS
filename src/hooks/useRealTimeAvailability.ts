import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getAvailableTimeSlots } from '../lib/scheduling';
import { validateAppointmentAvailability } from '../lib/appointmentValidation';
import type { TimeSlotWithReason } from '../lib/scheduling';

interface UseRealTimeAvailabilityProps {
  selectedDate: string;
  serviceDuration: number;
  selectedLocation?: string;
  refreshInterval?: number;
}

interface AvailabilityState {
  timeSlots: TimeSlotWithReason[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isValidating: boolean;
}

export function useRealTimeAvailability({
  selectedDate,
  serviceDuration,
  selectedLocation,
  refreshInterval = 30000
}: UseRealTimeAvailabilityProps) {
  const [state, setState] = useState<AvailabilityState>({
    timeSlots: [],
    loading: false,
    error: null,
    lastUpdated: null,
    isValidating: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const channelRef = useRef<any>(null);

  // Función para validar disponibilidad de un horario específico
  const validateSpecificTimeSlot = useCallback(async (time: string): Promise<boolean> => {
    if (!selectedDate || !time) return false;

    try {
      const result = await validateAppointmentAvailability(
        selectedDate, 
        time, 
        serviceDuration, 
        selectedLocation
      );
      return result.isAvailable;
    } catch (error) {
      console.error('Error validating time slot:', error);
      return false;
    }
  }, [selectedDate, serviceDuration, selectedLocation]);

  // Función para obtener horarios disponibles
  const fetchAvailableSlots = useCallback(async (signal?: AbortSignal) => {
    if (!selectedDate || !serviceDuration) {
      setState(prev => ({ ...prev, timeSlots: [], loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, isValidating: true }));

    try {
      console.log(`🔄 Fetching slots for ${selectedDate} (duration: ${serviceDuration}min)`);
      const slots = await getAvailableTimeSlots(selectedDate, serviceDuration, selectedLocation);
      
      if (signal?.aborted) return;

      console.log(`✅ Loaded ${slots.length} time slots`);
      setState(prev => ({
        ...prev,
        timeSlots: slots,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isValidating: false
      }));
    } catch (error) {
      if (signal?.aborted) return;
      
      console.error('Error fetching available slots:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar horarios disponibles',
        isValidating: false
      }));
    }
  }, [selectedDate, serviceDuration, selectedLocation]);

  // Función para refrescar manualmente
  const refreshAvailability = useCallback(() => {
    // Cancelar solicitud anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo controlador de abort
    abortControllerRef.current = new AbortController();
    fetchAvailableSlots(abortControllerRef.current.signal);
  }, [fetchAvailableSlots]);

  // Configurar actualización automática
  useEffect(() => {
    // Limpiar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Cargar datos inicialmente
    refreshAvailability();

    // Configurar actualización periódica
    if (selectedDate && serviceDuration) {
      intervalRef.current = setInterval(() => {
        refreshAvailability();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedDate, serviceDuration, selectedLocation, refreshInterval, refreshAvailability]);

  // Suscribirse a cambios en tiempo real usando Supabase Realtime
  useEffect(() => {
    if (!selectedDate) return;

    // Limpiar canal anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`appointments-${selectedDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `date=eq.${selectedDate}`
        },
        (payload) => {
          console.log('Real-time appointment change detected:', payload);
          // Refrescar disponibilidad inmediatamente cuando hay cambios
          setTimeout(() => refreshAvailability(), 500);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_locks',
          filter: `date=eq.${selectedDate}`
        },
        (payload) => {
          console.log('Real-time lock change detected:', payload);
          // Refrescar cuando cambian los locks
          setTimeout(() => refreshAvailability(), 500);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [selectedDate, refreshAvailability]);

  return {
    ...state,
    validateSpecificTimeSlot,
    refreshAvailability,
    isRealTimeEnabled: true
  };
}