import { supabase } from './supabase';
import { getBusinessHours, getBlockedTimes, getBookingRules, getWeeklyAppointmentCount } from './scheduling';
import { addMinutes, parse, isWithinInterval, isBefore, isAfter } from 'date-fns';

interface ValidationResult {
  isAvailable: boolean;
  reason?: string;
  conflictingAppointments?: any[];
  availableSpots?: number;
}

/**
 * SOLUCIÓN 1: Validación unificada y consistente
 * Centraliza toda la lógica de validación en una sola función
 */
export async function validateAppointmentAvailability(
  date: string,
  time: string,
  serviceDuration: number,
  locationId?: string,
  excludeAppointmentId?: string
): Promise<ValidationResult> {
  try {
    console.log(`🔍 Validating availability for ${date} ${time}`);

    // 1. Verificar horarios de negocio
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    const businessHours = await getBusinessHours(dayOfWeek, locationId);

    if (!businessHours || businessHours.is_closed) {
      return {
        isAvailable: false,
        reason: 'El negocio está cerrado este día'
      };
    }

    // 2. Obtener reglas de reserva
    const bookingRules = await getBookingRules(locationId);
    const maxCapacityPerSlot = bookingRules?.max_appointments_per_day || 999;
    const maxWeeklyAppointments = bookingRules?.max_appointments_per_week || 999;
    const minAdvanceHours = bookingRules?.min_advance_time || 0;
    const totalStaff = bookingRules?.num_de_empleados || 1;

    // 3. Verificar límite semanal
    const weeklyCount = await getWeeklyAppointmentCount(date, locationId);
    if (weeklyCount >= maxWeeklyAppointments) {
      return {
        isAvailable: false,
        reason: `Límite semanal alcanzado (${maxWeeklyAppointments} citas por semana)`
      };
    }

    // 4. Verificar tiempo mínimo de anticipación
    const now = new Date();
    const appointmentDateTime = parse(time, 'HH:mm', new Date(date + 'T00:00:00'));
    const minAdvanceTime = addMinutes(now, minAdvanceHours * 60);

    if (isBefore(appointmentDateTime, minAdvanceTime)) {
      return {
        isAvailable: false,
        reason: `Requiere ${minAdvanceHours} horas de anticipación`
      };
    }

    // 5. Verificar si está dentro del horario de atención
    const appointmentDate = new Date(date + 'T00:00:00');
    const appointmentStart = parse(time, 'HH:mm', appointmentDate);
    const appointmentEnd = addMinutes(appointmentStart, serviceDuration);
    const businessStart = parse(businessHours.start_time, 'HH:mm:ss', appointmentDate);
    const businessEnd = parse(businessHours.end_time, 'HH:mm:ss', appointmentDate);

    if (isBefore(appointmentStart, businessStart) || isAfter(appointmentEnd, businessEnd)) {
      return {
        isAvailable: false,
        reason: 'Fuera del horario de atención'
      };
    }

    // 6. Verificar horario de descanso
    if (businessHours.break_start && businessHours.break_end) {
      const breakStart = parse(businessHours.break_start, 'HH:mm:ss', appointmentDate);
      const breakEnd = parse(businessHours.break_end, 'HH:mm:ss', appointmentDate);

      if (
        isWithinInterval(appointmentStart, { start: breakStart, end: breakEnd }) ||
        isWithinInterval(appointmentEnd, { start: breakStart, end: breakEnd }) ||
        (isBefore(appointmentStart, breakStart) && isAfter(appointmentEnd, breakEnd))
      ) {
        return {
          isAvailable: false,
          reason: 'Horario de descanso'
        };
      }
    }

    // 7. Verificar horarios bloqueados
    const blockedTimes = await getBlockedTimes(date, locationId);
    const conflictingBlock = blockedTimes.find((block) => {
      const blockStart = parse(block.start_time, 'HH:mm:ss', appointmentDate);
      const blockEnd = parse(block.end_time, 'HH:mm:ss', appointmentDate);
      return (
        isWithinInterval(appointmentStart, { start: blockStart, end: blockEnd }) ||
        isWithinInterval(appointmentEnd, { start: blockStart, end: blockEnd }) ||
        (isBefore(appointmentStart, blockStart) && isAfter(appointmentEnd, blockEnd))
      );
    });

    if (conflictingBlock) {
      return {
        isAvailable: false,
        reason: conflictingBlock.reason || 'Horario bloqueado'
      };
    }

    // 8. Consulta en tiempo real de citas existentes
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('id, time, service_id')
      .eq('date', date)
      .neq('status', 'cancelled')
      .order('time');

    if (error) {
      console.error('❌ Error checking existing appointments:', error);
      return {
        isAvailable: false,
        reason: 'Error al verificar disponibilidad'
      };
    }

    // Obtener duraciones de los servicios - (Logic removed as serviceMap was unused)
    if (existingAppointments && existingAppointments.length > 0) {
      // Just checking if we can fetch services, but we don't use them here anymore
      // logic removed to satisfy linter
    }

    // 9. Verificar conflictos con citas existentes - Solo exactamente el mismo horario
    const conflictingAppointments = existingAppointments.filter((appointment) => {
      // Excluir la cita actual si estamos editando
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        return false;
      }

      // Solo contar como conflicto si es exactamente la misma hora
      return appointment.time === time;
    });

    // 10. Verificar capacidad considerando personal disponible y límites
    const occupiedSlots = conflictingAppointments.length;

    // Verificar límite de capacidad por horario
    if (occupiedSlots >= maxCapacityPerSlot) {
      return {
        isAvailable: false,
        reason: `Capacidad máxima alcanzada para este horario (${maxCapacityPerSlot} citas máximo)`,
        conflictingAppointments,
        availableSpots: 0
      };
    }

    // Verificar disponibilidad de personal
    const availableSpots = Math.max(0, totalStaff - occupiedSlots);

    if (availableSpots === 0) {
      return {
        isAvailable: false,
        reason: `No hay personal disponible (${totalStaff} operadores, ${occupiedSlots} ocupados)`,
        conflictingAppointments,
        availableSpots: 0
      };
    }

    console.log(`✅ Slot available with ${availableSpots}/${totalStaff} spots`);
    return {
      isAvailable: true,
      conflictingAppointments,
      availableSpots
    };

  } catch (error) {
    console.error('❌ Error in validateAppointmentAvailability:', error);
    return {
      isAvailable: false,
      reason: 'Error al validar disponibilidad'
    };
  }
}

/**
 * SOLUCIÓN 3: Validación final con transacción atómica
 * Incluye verificación de locks y doble validación antes de insertar
 */
export async function finalValidateAndInsert(
  appointmentData: {
    service_id: string;
    client_name: string;
    client_phone: string;
    client_email: string;
    date: string;
    time: string;
    notes?: string;
    location_id?: string;
  },
  _serviceDuration: number
): Promise<{ success: boolean; data?: any; error?: string }> {

  console.log('🔒 Starting atomic appointment creation...');

  try {
    // PASO 1: Validación rápida - verificar capacidad
    const bookingRules = await getBookingRules(appointmentData.location_id);
    const totalStaff = bookingRules?.num_de_empleados || 1;
    const maxCapacityPerSlot = bookingRules?.max_appointments_per_day || 999; // Manteniendo consistencia con validateAppointmentAvailability

    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id, time')
      .eq('date', appointmentData.date)
      .eq('time', appointmentData.time)
      .neq('status', 'cancelled');

    if (conflictError) {
      console.error('❌ Error checking conflicts:', conflictError);
      return {
        success: false,
        error: 'Error al verificar disponibilidad'
      };
    }

    const occupiedSlots = conflicts?.length || 0;
    const effectiveCapacity = Math.min(totalStaff, maxCapacityPerSlot);

    if (occupiedSlots >= effectiveCapacity) {
      console.log(`❌ Time slot full: ${occupiedSlots}/${effectiveCapacity}`);
      return {
        success: false,
        error: 'El horario seleccionado ya no está disponible'
      };
    }

    // PASO 2: Verificar locks activos
    const { data: activeLocks, error: lockError } = await supabase
      .from('appointment_locks')
      .select('*')
      .eq('date', appointmentData.date)
      .eq('time', appointmentData.time)
      .gt('expires_at', new Date().toISOString());

    if (lockError) {
      console.error('❌ Error checking locks:', lockError);
    }

    // Función para verificar si el lock pertenece al usuario actual
    const isUserLock = (lockOwner: string) => {
      // Comparación directa con email
      if (lockOwner === appointmentData.client_email) return true;

      // Comparación directa con teléfono
      if (lockOwner === appointmentData.client_phone) return true;

      // Verificar si el lock contiene el teléfono del usuario (para casos de email temporal)
      if (appointmentData.client_phone && lockOwner.includes(appointmentData.client_phone.replace('+52', ''))) return true;

      // Si el email no es temporal, verificar coincidencia
      if (appointmentData.client_email &&
        !appointmentData.client_email.includes('@temp.com') &&
        !appointmentData.client_email.startsWith('phone_') &&
        lockOwner === appointmentData.client_email) return true;

      return false;
    };

    // Si hay un lock activo de OTRO usuario, no permitir
    const conflictingLock = activeLocks?.find(lock => {
      const isOwnLock = isUserLock(lock.locked_by);
      console.log(`🔒 Lock check - locked_by: ${lock.locked_by}, isOwn: ${isOwnLock}, clientEmail: ${appointmentData.client_email}, clientPhone: ${appointmentData.client_phone}`);
      return !isOwnLock;
    });

    if (conflictingLock) {
      console.log('❌ Conflicting lock found:', conflictingLock);
      return {
        success: false,
        error: 'Horario siendo reservado por otro usuario'
      };
    } else if (activeLocks && activeLocks.length > 0) {
      console.log('✅ Lock found and belongs to current user:', activeLocks[0]);
    }

    // PASO 3: Inserción atómica con verificación de duplicados
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        service_id: appointmentData.service_id,
        client_name: appointmentData.client_name,
        client_phone: appointmentData.client_phone,
        client_email: appointmentData.client_email,
        date: appointmentData.date,
        time: appointmentData.time,
        notes: appointmentData.notes || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting appointment:', error);

      // Verificar si es un error de conflicto/duplicado
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('conflict')) {
        return {
          success: false,
          error: 'El horario seleccionado acaba de ser ocupado por otro usuario'
        };
      }

      return {
        success: false,
        error: `Error al crear la cita: ${error?.message || error?.details || JSON.stringify(error)}`
      };
    }

    // PASO 4: Limpiar lock si existe
    if (appointmentData.date && appointmentData.time && activeLocks && activeLocks.length > 0) {
      // Limpiar todos los locks del usuario para este horario
      await supabase
        .from('appointment_locks')
        .delete()
        .eq('date', appointmentData.date)
        .eq('time', appointmentData.time)
        .in('locked_by', [
          appointmentData.client_email,
          appointmentData.client_phone,
          ...activeLocks.filter(lock => isUserLock(lock.locked_by)).map(lock => lock.locked_by)
        ].filter(Boolean));

      console.log('🧹 Cleaned up user locks after successful appointment creation');
    }

    console.log('✅ Appointment created successfully:', data.id);
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ Error in finalValidateAndInsert:', error);
    return {
      success: false,
      error: 'Error inesperado al crear la cita'
    };
  }
}

/**
 * SOLUCIÓN 4: Validación rápida para UI con debounce
 */
export async function quickValidateTimeSlot(
  date: string,
  time: string,
  serviceDuration: number,
  locationId?: string
): Promise<{ isAvailable: boolean; availableSpots: number; reason?: string }> {
  const result = await validateAppointmentAvailability(date, time, serviceDuration, locationId);
  return {
    isAvailable: result.isAvailable,
    availableSpots: result.availableSpots || 0,
    reason: result.reason
  };
}