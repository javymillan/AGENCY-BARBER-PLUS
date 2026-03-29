import React, { useState, useEffect } from 'react';
import { useReminders } from '../../../contexts/ReminderContext';
import { useAppointments } from '../../../contexts/AppointmentContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import './ReminderManager.css';

interface ReminderManagerProps {
  isAdminAuthenticated: boolean; // Mantenemos el prop pero no lo usamos para restricciones
}

const ReminderManager: React.FC<ReminderManagerProps> = ({ isAdminAuthenticated }) => {
  const { reminders, loading, error, scheduleAppointmentReminder, markReminderAsSent } = useReminders();
  const { appointments } = useAppointments();
  const [selectedTab, setSelectedTab] = useState<'pending' | 'sent' | 'schedule'>('schedule');
  const [reminderType, setReminderType] = useState<'sms' | 'email' | 'push'>('sms');

  // Filtrar recordatorios pendientes y enviados
  const pendingReminders = reminders.filter(reminder => !reminder.sent);
  const sentReminders = reminders.filter(reminder => reminder.sent);
  
  // Obtener citas sin recordatorios programados
  const appointmentsWithoutReminders = appointments.filter(
    app => app.status === 'pending' && !app.reminder_sent &&
    !reminders.some(reminder => reminder.appointment_id === app.id)
  );

  // Programar recordatorios para citas que no tienen uno
  useEffect(() => {
    if (appointmentsWithoutReminders.length > 0) {
      toast.info(`Se encontraron ${appointmentsWithoutReminders.length} citas sin recordatorios programados`);
    }
  }, [appointmentsWithoutReminders.length]);

  // Función para programar un recordatorio para una cita - DISPONIBLE PARA TODOS
  const handleScheduleReminder = async (appointmentId: string) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (!appointment) return;

    try {
      await scheduleAppointmentReminder(appointment, reminderType);
      toast.success(`Recordatorio por ${reminderType === 'sms' ? 'SMS' : reminderType === 'email' ? 'Email' : 'Notificación'} programado correctamente`);
    } catch (error) {
      console.error('Error al programar recordatorio:', error);
      toast.error('Error al programar el recordatorio');
    }
  };

  // Función para simular el envío de un recordatorio - DISPONIBLE PARA TODOS
  const handleSendReminder = async (reminderId: string) => {
    try {
      await markReminderAsSent(reminderId);
      toast.success('Recordatorio enviado correctamente');
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
      toast.error('Error al enviar el recordatorio');
    }
  };

  // Función para obtener información de la cita asociada a un recordatorio
  const getAppointmentInfo = (appointmentId: string) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    return appointment ? {
      clientName: appointment.client_name,
      serviceName: appointment.services?.name || 'Servicio no especificado',
      date: appointment.date,
      time: appointment.time
    } : null;
  };

  if (loading) {
    return <div className="loading">Cargando recordatorios...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="reminder-manager">
      <h2>Gestión de Recordatorios</h2>
      
      <div className="tabs">
        <button 
          className={`tab ${selectedTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setSelectedTab('schedule')}
        >
          Programar ({appointmentsWithoutReminders.length})
        </button>
        <button 
          className={`tab ${selectedTab === 'pending' ? 'active' : ''}`}
          onClick={() => setSelectedTab('pending')}
        >
          Pendientes ({pendingReminders.length})
        </button>
        <button 
          className={`tab ${selectedTab === 'sent' ? 'active' : ''}`}
          onClick={() => setSelectedTab('sent')}
        >
          Enviados ({sentReminders.length})
        </button>
      </div>
      
      {selectedTab === 'schedule' && (
        <>
          <div className="reminder-type-selector">
            <label>Tipo de recordatorio:</label>
            <div className="reminder-type-options">
              <label className={`reminder-type-option ${reminderType === 'sms' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="reminderType" 
                  value="sms" 
                  checked={reminderType === 'sms'} 
                  onChange={() => setReminderType('sms')} 
                />
                SMS
              </label>
              <label className={`reminder-type-option ${reminderType === 'email' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="reminderType" 
                  value="email" 
                  checked={reminderType === 'email'} 
                  onChange={() => setReminderType('email')} 
                />
                Email
              </label>
              <label className={`reminder-type-option ${reminderType === 'push' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="reminderType" 
                  value="push" 
                  checked={reminderType === 'push'} 
                  onChange={() => setReminderType('push')} 
                />
                Notificación Push
              </label>
            </div>
          </div>

          <div className="appointments-without-reminders">
            <h3>Citas sin recordatorios ({appointmentsWithoutReminders.length})</h3>
            {appointmentsWithoutReminders.length > 0 ? (
              <div className="appointments-list">
                {appointmentsWithoutReminders.map(appointment => (
                  <div key={appointment.id} className="appointment-card">
                    <div className="appointment-info">
                      <h4>{appointment.client_name}</h4>
                      <p><strong>Teléfono:</strong> {appointment.client_phone}</p>
                      <p><strong>Servicio:</strong> {appointment.services?.name || 'No especificado'}</p>
                      <p><strong>Fecha:</strong> {format(parseISO(appointment.date), 'PPP', { locale: es })}</p>
                      <p><strong>Hora:</strong> {appointment.time}</p>
                      <p><strong>Estado:</strong> <span className="status-pending">Pendiente</span></p>
                    </div>
                    <div className="appointment-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleScheduleReminder(appointment.id)}
                      >
                        Programar Recordatorio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>✅ Todas las citas pendientes tienen recordatorios programados</p>
              </div>
            )}
          </div>
        </>
      )}

      {selectedTab === 'pending' && (
        <div className="reminders-list">
          {pendingReminders.length > 0 ? (
            pendingReminders.map(reminder => {
              const appointmentInfo = getAppointmentInfo(reminder.appointment_id);
              if (!appointmentInfo) return null;

              return (
                <div key={reminder.id} className="reminder-card">
                  <div className="reminder-info">
                    <h3>{appointmentInfo.clientName}</h3>
                    <p><strong>Servicio:</strong> {appointmentInfo.serviceName}</p>
                    <p><strong>Fecha:</strong> {format(parseISO(appointmentInfo.date), 'PPP', { locale: es })}</p>
                    <p><strong>Hora:</strong> {appointmentInfo.time}</p>
                    <p><strong>Programado para:</strong> {format(parseISO(reminder.scheduled_time), 'PPP p', { locale: es })}</p>
                    <p><strong>Tipo:</strong> {reminder.reminder_type === 'sms' ? 'SMS' : reminder.reminder_type === 'email' ? 'Email' : 'Notificación'}</p>
                  </div>
                  <div className="reminder-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleSendReminder(reminder.id)}
                    >
                      Enviar Ahora
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-data">No hay recordatorios pendientes</p>
          )}
        </div>
      )}

      {selectedTab === 'sent' && (
        <div className="reminders-list">
          {sentReminders.length > 0 ? (
            sentReminders.map(reminder => {
              const appointmentInfo = getAppointmentInfo(reminder.appointment_id);
              if (!appointmentInfo) return null;

              return (
                <div key={reminder.id} className="reminder-card sent">
                  <div className="reminder-info">
                    <h3>{appointmentInfo.clientName}</h3>
                    <p><strong>Servicio:</strong> {appointmentInfo.serviceName}</p>
                    <p><strong>Fecha:</strong> {format(parseISO(appointmentInfo.date), 'PPP', { locale: es })}</p>
                    <p><strong>Hora:</strong> {appointmentInfo.time}</p>
                    <p><strong>Enviado:</strong> {format(parseISO(reminder.sent_at || ''), 'PPP p', { locale: es })}</p>
                    <p><strong>Tipo:</strong> {reminder.reminder_type === 'sms' ? 'SMS' : reminder.reminder_type === 'email' ? 'Email' : 'Notificación'}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-data">No hay recordatorios enviados</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderManager;
