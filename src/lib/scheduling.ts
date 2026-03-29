import { supabase } from './supabase';
import { cacheService } from './cache';
import { addMinutes, format, isWithinInterval, parse, isBefore, isAfter } from 'date-fns';
import type { BusinessHours, BlockedTime, BookingRules } from '../types';

export interface TimeSlotWithReason {
  time: string;
  available: boolean;
  reason?: string;
  availableSpots?: number;
}

// Función para obtener el conteo semanal de citas - EXPORTADA para uso en appointmentValidation.ts
export async function getWeeklyAppointmentCount(date: string, _locationId?: string): Promise<number> {
  try {
    const selectedDate = new Date(date + 'T00:00:00');
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .gte('date', format(startOfWeek, 'yyyy-MM-dd'))
      .lte('date', format(endOfWeek, 'yyyy-MM-dd'))
      .neq('status', 'cancelled');

    if (error) throw error;

    return data?.length || 0;
  } catch (error) {
    console.error('Error getting weekly appointment count:', error);
    return 0;
  }
}

export async function getBookingRules(locationId?: string): Promise<BookingRules | null> {
  try {
    const cacheKey = `booking_rules_${locationId || 'default'}`;
    const cachedData = cacheService.get<BookingRules>(cacheKey);
    if (cachedData) return cachedData;
    
    const { data, error } = await supabase
      .from('booking_rules')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      // Create default booking rules in the database
      const defaultRules = {
        id: 'default',
        appointment_duration: 30,
        min_advance_time: 0,
        max_appointments_per_day: 999,
        max_appointments_per_week: 999,
        min_cancellation_notice: 0,
        num_de_empleados: 1
      };
      
      const { data: insertedData, error: insertError } = await supabase
        .from('booking_rules')
        .insert([defaultRules])
        .select()
        .single();
        
      if (insertError) {
        console.error('Error inserting default booking rules:', insertError);
        // Still return default rules even if insert fails
        cacheService.set(cacheKey, defaultRules, 60 * 60 * 1000);
        return defaultRules;
      }
      
      cacheService.set(cacheKey, insertedData, 60 * 60 * 1000);
      return insertedData;
    }
    
    cacheService.set(cacheKey, data, 60 * 60 * 1000);
    return data;
  } catch (error) {
    console.error('Error fetching booking rules:', error);
    return null;
  }
}

export async function getBusinessHours(dayOfWeek: number, locationId?: string): Promise<BusinessHours | null> {
  try {
    const cacheKey = `business_hours_${dayOfWeek}_${locationId || 'default'}`;
    const cachedData = cacheService.get<BusinessHours>(cacheKey);
    if (cachedData) return cachedData;
    
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek.toString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      const defaultHours = {
        id: `day_${dayOfWeek}`,
        day_of_week: dayOfWeek.toString(),
        start_time: '09:00:00',
        end_time: '19:00:00',
        is_closed: dayOfWeek === 0, // Closed on Sundays by default
        break_start: '14:00:00',
        break_end: '15:00:00',
        location_id: locationId
      };
      
      cacheService.set(cacheKey, defaultHours, 30 * 60 * 1000);
      return defaultHours;
    }
    
    cacheService.set(cacheKey, data, 30 * 60 * 1000);
    return data;
  } catch (error) {
    console.error('Error fetching business hours:', error);
    return null;
  }
}

export async function getBlockedTimes(date: string, locationId?: string): Promise<BlockedTime[]> {
  try {
    const cacheKey = `blocked_times_${date}_${locationId || 'default'}`;
    const cachedData = cacheService.get<BlockedTime[]>(cacheKey);
    if (cachedData) return cachedData;
    
    const { data, error } = await supabase
      .from('blocked_times')
      .select('*')
      .eq('date', date);
      
    if (error) throw error;
    
    const result = data || [];
    cacheService.set(cacheKey, result, 15 * 60 * 1000);
    return result;
  } catch (error) {
    console.error('Error fetching blocked times:', error);
    return [];
  }
}

interface ExistingAppointment {
  id: string;
  time: string;
  service_id: string;
  services?: { duration: number };
}

async function getExistingAppointments(date: string, _locationId?: string): Promise<ExistingAppointment[]> {
  try {
    // NO usar caché para citas existentes - siempre consultar en tiempo real
    const { data, error } = await supabase
      .from('appointments')
      .select('id, time, service_id')
      .eq('date', date)
      .neq('status', 'cancelled')
      .order('time');

    if (error) throw error;

    if (!data || data.length === 0) return [];

    // Obtener duraciones de los servicios
    const serviceIds = [...new Set(data.map(a => a.service_id))];
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, duration')
      .in('id', serviceIds);

    if (servicesError) throw servicesError;

    // Mapear duraciones a citas
    const serviceMap = services ? services.reduce((acc, s) => {
      acc[s.id] = s.duration;
      return acc;
    }, {} as Record<string, number>) : {};

    return data.map(appointment => ({
      ...appointment,
      services: { duration: serviceMap[appointment.service_id] || 30 }
    }));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

export async function getAvailableTimeSlots(
  selectedDate: string,
  serviceDuration: number,
  locationId?: string
): Promise<TimeSlotWithReason[]> {
  try {
    console.log(`🕐 Generating time slots for ${selectedDate}`);
    const date = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = date.getDay();

    const [businessHours, blockedTimes, bookingRules, existingAppointments, staffSchedules] = await Promise.all([
      getBusinessHours(dayOfWeek, locationId),
      getBlockedTimes(selectedDate, locationId),
      getBookingRules(locationId),
      getExistingAppointments(selectedDate, locationId),
      getStaffSchedules(selectedDate, locationId)
    ]);

    console.log(`📊 Found ${existingAppointments.length} existing appointments`);

    if (!businessHours) {
      return [{
        time: '',
        available: false,
        reason: 'No hay información de horarios disponible para este día'
      }];
    }

    if (businessHours.is_closed) {
      return [{
        time: '',
        available: false,
        reason: 'El negocio está cerrado este día'
      }];
    }

    const startTime = parse(businessHours.start_time, 'HH:mm:ss', date);
    const endTime = parse(businessHours.end_time, 'HH:mm:ss', date);
    
    // Obtener reglas de capacidad y restricciones
    const maxCapacityPerSlot = bookingRules?.max_appointments_per_day || 999;
    const maxWeeklyAppointments = bookingRules?.max_appointments_per_week || 999;
    const minAdvanceHours = bookingRules?.min_advance_time || 0;
    const totalStaff = bookingRules?.num_de_empleados || 1;

    const timeSlots: TimeSlotWithReason[] = [];
    let currentTime = startTime;

    // Verificar límite semanal si aplica
    const weeklyCount = await getWeeklyAppointmentCount(selectedDate, locationId);
    if (weeklyCount >= maxWeeklyAppointments) {
      return [{
        time: '',
        available: false,
        reason: `Límite semanal alcanzado (${maxWeeklyAppointments} citas por semana)`
      }];
    }

    // Verificar tiempo mínimo de anticipación
    const now = new Date();
    const selectedDateTime = new Date(selectedDate + 'T00:00:00');
    const minAdvanceTime = addMinutes(now, minAdvanceHours * 60);

    while (currentTime < endTime) {
      const timeString = format(currentTime, 'HH:mm');
      const slotDateTime = parse(timeString, 'HH:mm', selectedDateTime);
      const slotEnd = addMinutes(slotDateTime, serviceDuration);
      
      // 1. Verificar tiempo mínimo de anticipación
      if (isBefore(slotDateTime, minAdvanceTime)) {
        timeSlots.push({
          time: timeString,
          available: false,
          reason: `Requiere ${minAdvanceHours} horas de anticipación`,
          availableSpots: 0
        });
        currentTime = addMinutes(currentTime, 30);
        continue;
      }

      // 2. Verificar horario de descanso
      let isInBreakTime = false;
      let breakReason = '';
      
      if (businessHours.break_start && businessHours.break_end) {
        const breakStart = parse(businessHours.break_start, 'HH:mm:ss', date);
        const breakEnd = parse(businessHours.break_end, 'HH:mm:ss', date);
        
        if (
          isWithinInterval(slotDateTime, { start: breakStart, end: breakEnd }) ||
          isWithinInterval(slotEnd, { start: breakStart, end: breakEnd }) ||
          (isBefore(slotDateTime, breakStart) && isAfter(slotEnd, breakEnd))
        ) {
          isInBreakTime = true;
          breakReason = 'Horario de descanso del personal';
        }
      }

      // 3. Verificar horarios bloqueados
      const conflictingBlock = blockedTimes.find((block) => {
        const blockStart = parse(block.start_time, 'HH:mm:ss', date);
        const blockEnd = parse(block.end_time, 'HH:mm:ss', date);
        return (
          isWithinInterval(slotDateTime, { start: blockStart, end: blockEnd }) ||
          isWithinInterval(slotEnd, { start: blockStart, end: blockEnd }) ||
          (isBefore(slotDateTime, blockStart) && isAfter(slotEnd, blockEnd))
        );
      });

      // 4. Verificar disponibilidad del personal
      const availableStaff = getAvailableStaffCount(slotDateTime, slotEnd, staffSchedules, totalStaff);
      
      // 5. Calcular citas existentes que se solapan
      const conflictingAppointments = existingAppointments.filter((appointment) => {
        const existingStart = parse(appointment.time, 'HH:mm:ss', date);
        const existingDuration = appointment.services?.duration || 30;
        const existingEnd = addMinutes(existingStart, existingDuration);

        // Verificar si hay solapamiento
        return (
          isWithinInterval(slotDateTime, { start: existingStart, end: existingEnd }) ||
          isWithinInterval(slotEnd, { start: existingStart, end: existingEnd }) ||
          isWithinInterval(existingStart, { start: slotDateTime, end: slotEnd }) ||
          (isBefore(slotDateTime, existingStart) && isAfter(slotEnd, existingEnd))
        );
      });

      // 6. Calcular posiciones disponibles considerando personal disponible
      const maxSlotsForThisTime = Math.min(availableStaff, totalStaff);
      const occupiedSlots = conflictingAppointments.length;
      const availableSpots = Math.max(0, maxSlotsForThisTime - occupiedSlots);
      
      // 7. Determinar disponibilidad y razón
      let isAvailable = true;
      let reason = '';
      
      if (isInBreakTime) {
        isAvailable = false;
        reason = breakReason;
      } else if (conflictingBlock) {
        isAvailable = false;
        reason = conflictingBlock.reason || 'Horario bloqueado';
      } else if (availableStaff === 0) {
        isAvailable = false;
        reason = 'Personal no disponible en este horario';
      } else if (availableSpots === 0) {
        isAvailable = false;
        reason = 'Todas las posiciones ocupadas';
      } else if (occupiedSlots >= maxCapacityPerSlot) {
        isAvailable = false;
        reason = 'Capacidad máxima alcanzada para este horario';
      }

      timeSlots.push({
        time: timeString,
        available: isAvailable,
        reason: reason,
        availableSpots: availableSpots
      });

      currentTime = addMinutes(currentTime, 30);
    }

    console.log(`✅ Generated ${timeSlots.length} time slots`);
    return timeSlots;
  } catch (error) {
    console.error('Error generating time slots:', error);
    return [{
      time: '',
      available: false,
      reason: 'Error al generar horarios disponibles'
    }];
  }
}

interface StaffSchedule {
  start_time: string;
  end_time: string;
  is_on_break: boolean;
}

// Función para obtener horarios del personal
async function getStaffSchedules(_date: string, _locationId?: string): Promise<StaffSchedule[]> {
  try {
    // Por ahora retornamos un array vacío, pero aquí se consultarían los horarios del personal
    // desde una tabla como 'staff_schedules' o similar
    return [];
  } catch (error) {
    console.error('Error fetching staff schedules:', error);
    return [];
  }
}

// Función para calcular personal disponible en un horario específico
function getAvailableStaffCount(
  slotStart: Date, 
  slotEnd: Date, 
  staffSchedules: StaffSchedule[], 
  totalStaff: number
): number {
  // Si no hay horarios específicos del personal, asumimos que todo el personal está disponible
  if (staffSchedules.length === 0) {
    return totalStaff;
  }
  
  // Aquí se implementaría la lógica para verificar qué personal está disponible
  // en el horario específico considerando sus horarios de trabajo y descansos
  let availableCount = 0;
  
  for (const schedule of staffSchedules) {
    const staffStart = parse(schedule.start_time, 'HH:mm:ss', slotStart);
    const staffEnd = parse(schedule.end_time, 'HH:mm:ss', slotStart);
    
    // Verificar si el personal está disponible durante todo el slot
    if (
      !isBefore(slotStart, staffStart) && 
      !isAfter(slotEnd, staffEnd) &&
      !schedule.is_on_break
    ) {
      availableCount++;
    }
  }
  
  return Math.min(availableCount, totalStaff);
}

