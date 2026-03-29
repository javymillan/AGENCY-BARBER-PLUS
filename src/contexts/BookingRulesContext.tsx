import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppointments } from './AppointmentContext';
import { useBusinessHours } from './BusinessHoursContext';
import { format, addMinutes } from 'date-fns';

interface BookingRules {
  id: string;
  appointment_duration?: number;
  min_advance_time?: number;
  max_appointments_per_day?: number;
  max_appointments_per_week?: number;
  min_cancellation_notice?: number;
  num_de_empleados?: number;
  created_at?: string;
  updated_at?: string;
}

interface TimeSlotInfo {
  time: string;
  availableSpaces: number;
  totalCapacity: number;
  maxDuration: number;
  isAvailable: boolean;
  message: string;
  conflictingAppointments: number;
}

interface BookingRulesContextType {
  bookingRules: BookingRules | null;
  loading: boolean;
  error: string | null;
  getAvailableTimeSlots: (date: Date, serviceId: string, serviceDuration: number) => Promise<string[]>;
  getDetailedTimeSlots: (date: Date, serviceId: string, serviceDuration: number) => Promise<TimeSlotInfo[]>;
  checkSlotAvailability: (date: Date, time: string, serviceDuration: number) => Promise<boolean>;
  getEmployeeCapacity: () => number;
}

const BookingRulesContext = createContext<BookingRulesContextType | undefined>(undefined);

export const useBookingRules = () => {
  const context = useContext(BookingRulesContext);
  if (!context) {
    throw new Error('useBookingRules debe ser usado dentro de un BookingRulesProvider');
  }
  return context;
};

interface BookingRulesProviderProps {
  children: React.ReactNode;
}

export const BookingRulesProvider: React.FC<BookingRulesProviderProps> = ({ children }) => {
  const [bookingRules, setBookingRules] = useState<BookingRules | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { appointments } = useAppointments();
  const { businessHours, blockedTimes } = useBusinessHours();

  // Cargar reglas de reserva
  const fetchBookingRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('booking_rules')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Si no hay reglas, usar valores por defecto
      const defaultRules: BookingRules = {
        id: 'default',
        appointment_duration: 30,
        min_advance_time: 2,
        max_appointments_per_day: 20,
        max_appointments_per_week: 100,
        min_cancellation_notice: 24,
        num_de_empleados: 2 // 2 empleados por defecto para demostrar el sistema
      };

      setBookingRules((data as BookingRules) || defaultRules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reglas de reserva');
      console.error('Error al cargar reglas de reserva:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener capacidad de empleados
  const getEmployeeCapacity = useCallback(() => {
    return bookingRules?.num_de_empleados || 2;
  }, [bookingRules]);

  // Calcular cuántas citas se superponen con un horario específico
  const getOverlappingAppointments = useCallback((
    date: Date,
    time: string,
    serviceDuration: number
  ): number => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const [hours, minutes] = time.split(':').map(Number);
    
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    
    const slotEnd = addMinutes(slotStart, serviceDuration);
    
    return appointments.filter(app => {
      if (app.date !== dateStr || app.status === 'cancelled') return false;
      
      const [appHours, appMinutes] = app.time.split(':').map(Number);
      const appStart = new Date(date);
      appStart.setHours(appHours, appMinutes, 0, 0);
      
      // Obtener duración del servicio de la cita (asumimos 30 min por defecto)
      const appDuration = app.services?.duration || 30;
      const appEnd = addMinutes(appStart, appDuration);
      
      // Verificar si hay superposición
      return slotStart < appEnd && slotEnd > appStart;
    }).length;
  }, [appointments]);

  // Verificar disponibilidad de un slot específico
  const checkSlotAvailability = useCallback(async (
    date: Date, 
    time: string, 
    serviceDuration: number
  ): Promise<boolean> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();
      
      // Verificar horario de negocio
      const businessHour = businessHours.find(h => h.day_of_week === dayOfWeek);
      if (!businessHour || businessHour.is_closed) {
        return false;
      }
      
      // Verificar si está dentro del horario de apertura
      const [hours, minutes] = time.split(':').map(Number);
      const slotTime = new Date(date);
      slotTime.setHours(hours, minutes, 0, 0);
      
      const [startHours, startMinutes] = businessHour.start_time.split(':').map(Number);
      const [endHours, endMinutes] = businessHour.end_time.split(':').map(Number);
      
      const openTime = new Date(date);
      openTime.setHours(startHours, startMinutes, 0, 0);
      
      const closeTime = new Date(date);
      closeTime.setHours(endHours, endMinutes, 0, 0);
      
      // Verificar que el servicio termine antes del cierre
      const serviceEndTime = addMinutes(slotTime, serviceDuration);
      
      if (slotTime < openTime || serviceEndTime > closeTime) {
        return false;
      }
      
      // Verificar horario de descanso
      if (businessHour.break_start && businessHour.break_end) {
        const [breakStartHours, breakStartMinutes] = businessHour.break_start.split(':').map(Number);
        const [breakEndHours, breakEndMinutes] = businessHour.break_end.split(':').map(Number);
        
        const breakStart = new Date(date);
        breakStart.setHours(breakStartHours, breakStartMinutes, 0, 0);
        
        const breakEnd = new Date(date);
        breakEnd.setHours(breakEndHours, breakEndMinutes, 0, 0);
        
        // Verificar si el servicio se superpone con el descanso
        if (slotTime < breakEnd && serviceEndTime > breakStart) {
          return false;
        }
      }
      
      // Verificar tiempos bloqueados
      const isBlocked = blockedTimes.some(blocked => {
        if (blocked.date !== dateStr) return false;
        
        const [blockedStartHours, blockedStartMinutes] = blocked.start_time.split(':').map(Number);
        const [blockedEndHours, blockedEndMinutes] = blocked.end_time.split(':').map(Number);
        
        const blockedStart = new Date(date);
        blockedStart.setHours(blockedStartHours, blockedStartMinutes, 0, 0);
        
        const blockedEnd = new Date(date);
        blockedEnd.setHours(blockedEndHours, blockedEndMinutes, 0, 0);
        
        return slotTime < blockedEnd && serviceEndTime > blockedStart;
      });
      
      if (isBlocked) {
        return false;
      }
      
      // Verificar capacidad de empleados
      const employeeCapacity = getEmployeeCapacity();
      const overlappingAppointments = getOverlappingAppointments(date, time, serviceDuration);
      
      return overlappingAppointments < employeeCapacity;
      
    } catch (err) {
      console.error('Error al verificar disponibilidad:', err);
      return false;
    }
  }, [businessHours, blockedTimes, getEmployeeCapacity, getOverlappingAppointments]);

  // Obtener información detallada de horarios con espacios disponibles
  const getDetailedTimeSlots = useCallback(async (
    date: Date, 
    _serviceId: string, 
    serviceDuration: number
  ): Promise<TimeSlotInfo[]> => {
    try {
      const dayOfWeek = date.getDay();

      // Horarios por defecto si Supabase aún no tiene datos
      const defaultHour: import('../types').BusinessHours = {
        id: 'default',
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '19:00',
        is_closed: dayOfWeek === 0, // Domingo cerrado por defecto
        break_start: '14:00',
        break_end: '15:00',
      };

      const businessHour = businessHours.find(h => h.day_of_week === dayOfWeek) ?? defaultHour;

      if (businessHour.is_closed) {
        return [];
      }
      
      const detailedSlots: TimeSlotInfo[] = [];
      const employeeCapacity = getEmployeeCapacity();
      
      // Generar slots cada 30 minutos
      const [startHours, startMinutes] = businessHour.start_time.split(':').map(Number);
      const [endHours, endMinutes] = businessHour.end_time.split(':').map(Number);
      
      const startTime = new Date(date);
      startTime.setHours(startHours, startMinutes, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(endHours, endMinutes, 0, 0);
      
      let currentTime = new Date(startTime);
      
      while (currentTime < endTime) {
        const timeStr = format(currentTime, 'HH:mm');
        
        // Verificar que el servicio termine antes del cierre
        const serviceEndTime = addMinutes(currentTime, serviceDuration);
        if (serviceEndTime <= endTime) {
          const overlappingAppointments = getOverlappingAppointments(date, timeStr, serviceDuration);
          const availableSpaces = Math.max(0, employeeCapacity - overlappingAppointments);
          const isAvailable = await checkSlotAvailability(date, timeStr, serviceDuration);
          
          // Calcular duración máxima permitida para este slot
          let maxDuration = serviceDuration;
          
          // Verificar si hay restricciones por horario de cierre
          const timeUntilClose = (endTime.getTime() - currentTime.getTime()) / (1000 * 60);
          maxDuration = Math.min(maxDuration, timeUntilClose);
          
          // Verificar si hay restricciones por horario de descanso
          if (businessHour.break_start && businessHour.break_end) {
            const [breakStartHours, breakStartMinutes] = businessHour.break_start.split(':').map(Number);
            const breakStart = new Date(date);
            breakStart.setHours(breakStartHours, breakStartMinutes, 0, 0);
            
            if (currentTime < breakStart) {
              const timeUntilBreak = (breakStart.getTime() - currentTime.getTime()) / (1000 * 60);
              maxDuration = Math.min(maxDuration, timeUntilBreak);
            }
          }
          
          // Generar mensaje descriptivo
          let message = '';
          if (!isAvailable) {
            if (availableSpaces === 0) {
              message = 'Sin espacios disponibles';
            } else {
              message = 'No disponible por restricciones';
            }
          } else if (availableSpaces === employeeCapacity) {
            message = `${availableSpaces} espacios disponibles`;
          } else if (availableSpaces === 1) {
            message = 'Último espacio disponible';
          } else {
            message = `${availableSpaces} espacios disponibles`;
          }
          
          detailedSlots.push({
            time: timeStr,
            availableSpaces,
            totalCapacity: employeeCapacity,
            maxDuration: Math.floor(maxDuration),
            isAvailable,
            message,
            conflictingAppointments: overlappingAppointments
          });
        }
        
        // Avanzar 30 minutos
        currentTime = addMinutes(currentTime, 30);
      }
      
      return detailedSlots;
      
    } catch (err) {
      console.error('Error al obtener horarios detallados:', err);
      return [];
    }
  }, [businessHours, checkSlotAvailability, getEmployeeCapacity, getOverlappingAppointments]);

  // Obtener horarios disponibles para una fecha y servicio (solo los disponibles)
  const getAvailableTimeSlots = useCallback(async (
    date: Date, 
    serviceId: string, 
    serviceDuration: number
  ): Promise<string[]> => {
    try {
      const detailedSlots = await getDetailedTimeSlots(date, serviceId, serviceDuration);
      return detailedSlots
        .filter(slot => slot.isAvailable && slot.availableSpaces > 0)
        .map(slot => slot.time);
    } catch (err) {
      console.error('Error al obtener horarios disponibles:', err);
      return [];
    }
  }, [getDetailedTimeSlots]);

  useEffect(() => {
    fetchBookingRules();
  }, []);

  const value = {
    bookingRules,
    loading,
    error,
    getAvailableTimeSlots,
    getDetailedTimeSlots,
    checkSlotAvailability,
    getEmployeeCapacity
  };

  return (
    <BookingRulesContext.Provider value={value}>
      {children}
    </BookingRulesContext.Provider>
  );
};