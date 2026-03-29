import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Reminder } from '../types/nuevas-funcionalidades';
import { Appointment } from '../types';
import { format, addHours, parseISO } from 'date-fns';
import { toast } from 'react-toastify';

interface ReminderContextType {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  createReminder: (reminder: Omit<Reminder, 'id' | 'created_at' | 'sent' | 'sent_at'>) => Promise<Reminder | null>;
  updateReminder: (id: string, reminder: Partial<Reminder>) => Promise<Reminder | null>;
  deleteReminder: (id: string) => Promise<boolean>;
  getAppointmentReminders: (appointmentId: string) => Reminder[];
  scheduleAppointmentReminder: (appointment: Appointment, reminderType?: 'sms' | 'email' | 'push') => Promise<Reminder | null>;
  markReminderAsSent: (id: string) => Promise<Reminder | null>;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders debe ser usado dentro de un ReminderProvider');
  }
  return context;
};

interface ReminderProviderProps {
  children: React.ReactNode;
}

export const ReminderProvider: React.FC<ReminderProviderProps> = ({ children }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar recordatorios
  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      setReminders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los recordatorios');
      console.error('Error al cargar los recordatorios:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear un nuevo recordatorio
  const createReminder = useCallback(async (reminder: Omit<Reminder, 'id' | 'created_at' | 'sent' | 'sent_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reminders')
        .insert([{ ...reminder, sent: false, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      setReminders([...reminders, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el recordatorio');
      console.error('Error al crear el recordatorio:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [reminders]);

  // Actualizar un recordatorio existente
  const updateReminder = useCallback(async (id: string, reminder: Partial<Reminder>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reminders')
        .update(reminder)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setReminders(reminders.map(rem => rem.id === id ? { ...rem, ...data } : rem));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el recordatorio');
      console.error('Error al actualizar el recordatorio:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [reminders]);

  // Eliminar un recordatorio
  const deleteReminder = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReminders(reminders.filter(rem => rem.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el recordatorio');
      console.error('Error al eliminar el recordatorio:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [reminders]);

  // Obtener recordatorios para una cita específica
  const getAppointmentReminders = useCallback((appointmentId: string) => {
    return reminders.filter(rem => rem.appointment_id === appointmentId);
  }, [reminders]);

  // Programar un recordatorio automático para una cita
  const scheduleAppointmentReminder = useCallback(async (appointment: Appointment, reminderType: 'sms' | 'email' | 'push' = 'sms') => {
    try {
      // Calcular la hora del recordatorio (24 horas antes de la cita)
      const appointmentDateTime = parseISO(`${appointment.date}T${appointment.time}`);
      const reminderTime = addHours(appointmentDateTime, -24);
      
      // Crear mensaje para el recordatorio según el tipo
      let message = `Recordatorio: Tiene una cita programada para ${format(appointmentDateTime, 'dd/MM/yyyy')} a las ${appointment.time}. Servicio: ${appointment.services?.name || 'No especificado'}`;
      
      // Personalizar mensaje según el tipo de recordatorio
      if (reminderType === 'email') {
        message = `<h2>Recordatorio de Cita</h2>
<p>Estimado/a ${appointment.client_name},</p>
<p>Le recordamos que tiene una cita programada para el <strong>${format(appointmentDateTime, 'dd/MM/yyyy')}</strong> a las <strong>${appointment.time}</strong>.</p>
<p>Servicio: ${appointment.services?.name || 'No especificado'}</p>
<p>Gracias por confiar en nosotros.</p>`;
      } else if (reminderType === 'push') {
        message = JSON.stringify({
          title: 'Recordatorio de Cita',
          body: `Tiene una cita programada para mañana a las ${appointment.time}`,
          data: {
            appointmentId: appointment.id,
            date: appointment.date,
            time: appointment.time,
            service: appointment.services?.name
          }
        });
      }
      
      // Crear el recordatorio
      const reminderData = {
        appointment_id: appointment.id,
        reminder_type: reminderType,
        scheduled_time: reminderTime.toISOString(),
        message: message
      };
      
      const result = await createReminder(reminderData);
      
      if (result) {
        // Actualizar la cita para indicar que se ha programado un recordatorio
        await supabase
          .from('appointments')
          .update({ reminder_sent: false })
          .eq('id', appointment.id);
      }
      
      return result;
    } catch (err) {
      console.error('Error al programar el recordatorio:', err);
      toast.error('Error al programar el recordatorio');
      return null;
    }
  }, [createReminder]);

  // Marcar un recordatorio como enviado
  const markReminderAsSent = useCallback(async (id: string) => {
    try {
      const reminder = reminders.find(rem => rem.id === id);
      if (!reminder) return null;
      
      const result = await updateReminder(id, { 
        sent: true, 
        sent_at: new Date().toISOString() 
      });
      
      if (result) {
        // Actualizar la cita para indicar que se ha enviado el recordatorio
        await supabase
          .from('appointments')
          .update({ reminder_sent: true })
          .eq('id', reminder.appointment_id);
      }
      
      return result;
    } catch (err) {
      console.error('Error al marcar el recordatorio como enviado:', err);
      return null;
    }
  }, [reminders, updateReminder]);

  // Cargar recordatorios al montar el componente
  useEffect(() => {
    fetchReminders();
  }, []);

  // Memoizar el valor del contexto para evitar renderizaciones innecesarias
  const value = useMemo(() => ({
    reminders,
    loading,
    error,
    createReminder,
    updateReminder,
    deleteReminder,
    getAppointmentReminders,
    scheduleAppointmentReminder,
    markReminderAsSent
  }), [
    reminders,
    loading,
    error,
    createReminder,
    updateReminder,
    deleteReminder,
    getAppointmentReminders,
    scheduleAppointmentReminder,
    markReminderAsSent
  ]);

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};