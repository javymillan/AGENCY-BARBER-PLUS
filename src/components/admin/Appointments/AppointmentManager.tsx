import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfDay } from 'date-fns';
import { useAppointments } from '../../../contexts/AppointmentContext';
import { useServices } from '../../../contexts/ServiceContext';
import { BookingRulesProvider } from '../../../contexts/BookingRulesContext';
import AppointmentsList from './AppointmentsList';
import AppointmentDetails from './AppointmentDetails';
import BookingFlow from '../Booking/BookingFlow';
import { Appointment } from '../../../types';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronUp, Plus, Calendar as CalendarIcon } from 'lucide-react';

interface AppointmentManagerProps {
  isAdminAuthenticated: boolean;
}

const AppointmentManager: React.FC<AppointmentManagerProps> = ({ isAdminAuthenticated }) => {
  const { appointments, fetchAppointments, updateAppointment, deleteAppointment } = useAppointments();
  const { services } = useServices();
  
  const [date, setDate] = useState(new Date());
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetailModal, setShowAppointmentDetailModal] = useState(false);
  const [isAllView, setIsAllView] = useState(false);
  
  // Estado para controlar si los servicios están expandidos o contraídos
  const [servicesExpanded, setServicesExpanded] = useState(false);
  
  // Filtrar citas para la fecha seleccionada
  const filteredAppointments = useMemo(() => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(app => app.date === dateStr);
  }, [appointments, date]);

  // Citas desde hoy en adelante ordenadas por fecha y hora
  const upcomingAppointments = useMemo(() => {
    const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');
    return [...appointments]
      .filter(app => app.date >= todayStr && app.status !== 'cancelled')
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
  }, [appointments]);
  
  // Actualizar citas para la fecha seleccionada cuando cambia la fecha o las citas
  useEffect(() => {
    if (date) {
      setSelectedDateAppointments(filteredAppointments);
    }
  }, [date, filteredAppointments]);

  // Manejar cambio de fecha en el calendario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateChange = useCallback((value: unknown) => {
    if (value instanceof Date) setDate(value);
  }, []);

  // Manejar clic en una fecha del calendario - muestra citas del día
  const handleDateClick = useCallback((clickedDate: Date) => {
    setDate(clickedDate);
    const dateStr = format(clickedDate, 'yyyy-MM-dd');
    const appointmentsForDate = appointments.filter(app => app.date === dateStr);
    if (appointmentsForDate.length > 0) {
      setSelectedDateAppointments(appointmentsForDate);
      setIsAllView(false);
      setShowAppointmentsModal(true);
    } else {
      toast.info(`No hay citas programadas para ${format(clickedDate, 'dd/MM/yyyy')}`);
    }
  }, [appointments]);

  // Manejar cierre del modal de lista de citas - memoizado para evitar recreaciones innecesarias
  const handleCloseAppointmentsModal = useCallback(() => {
    setShowAppointmentsModal(false);
  }, []);

  // Manejar selección de cita para ver detalles - memoizado para evitar recreaciones innecesarias
  const handleAppointmentSelect = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetailModal(true);
  }, []);

  // Manejar cierre del modal de detalles de cita - memoizado para evitar recreaciones innecesarias
  const handleCloseAppointmentDetailModal = useCallback(() => {
    setShowAppointmentDetailModal(false);
    setSelectedAppointment(null);
  }, []);

  // Manejar completar cita - DISPONIBLE PARA TODOS LOS USUARIOS
  const handleCompleteAppointment = useCallback(async (appointment: Appointment) => {
    try {
      await updateAppointment(appointment.id, { status: 'completed' });
      toast.success('Cita marcada como completada');
      setShowAppointmentDetailModal(false);
      fetchAppointments();
    } catch (error) {
      toast.error('Error al actualizar la cita');
    }
  }, [updateAppointment, fetchAppointments]);

  // Manejar cancelar cita - DISPONIBLE PARA TODOS LOS USUARIOS
  const handleCancelAppointment = useCallback(async (appointment: Appointment) => {
    try {
      await deleteAppointment(appointment.id);
      toast.success('Cita cancelada correctamente');
      setShowAppointmentDetailModal(false);
      fetchAppointments();
    } catch (error) {
      toast.error('Error al cancelar la cita');
    }
  }, [deleteAppointment, fetchAppointments]);

  // Función para alternar la expansión de servicios
  const toggleServicesExpansion = () => {
    setServicesExpanded(!servicesExpanded);
  };

  return (
    <BookingRulesProvider>
      <div className="appointment-manager">
        {/* Botón principal para nueva reserva */}
        <div className="main-actions">
          <button 
            className="btn btn-primary new-booking-btn"
            onClick={() => setShowBookingFlow(true)}
          >
            <Plus size={20} />
            Nueva Reserva
          </button>
        </div>

        <div className="calendar-container">
          <Calendar 
            onChange={handleDateChange} 
            value={date} 
            onClickDay={handleDateClick}
            locale="es-ES"
            calendarType="gregory" // Esto hace que el calendario empiece por domingo
            tileClassName={({ date }) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const hasAppointments = appointments.some(app => app.date === dateStr);
              return hasAppointments ? 'has-appointments' : '';
            }}
          />
        </div>

        <div className="services-container">
          <div className="services-header" onClick={toggleServicesExpansion}>
            <h3>Servicios Disponibles</h3>
            <button className="expand-toggle-btn">
              {servicesExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
          </div>
          
          <div className={`services-list ${servicesExpanded ? 'expanded' : 'collapsed'}`}>
            {services.map(service => (
              <div 
                key={service.id} 
                className="service-card"
              >
                <h4>{service.name}</h4>
                <p>{service.description}</p>
                <div className="service-details">
                  <span>Duración: {service.duration} min</span>
                  <span>Precio: ${service.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ELIMINADO COMPLETAMENTE: El contenedor de horarios que causaba la duplicación */}
        {/* Ya no mostramos horarios aquí, solo en el flujo de reserva */}

        {/* Botón para ver todas las citas */}
        <div className="admin-actions">
          <button 
            className="btn btn-secondary view-appointments-btn"
            onClick={() => {
              setIsAllView(true);
              setShowAppointmentsModal(true);
            }}
          >
            <CalendarIcon size={20} />
            Ver Todas las Citas
          </button>
        </div>

        {/* Modal para el flujo de reserva completo */}
        {showBookingFlow && (
          <div className="modal-overlay">
            <BookingFlow onClose={() => setShowBookingFlow(false)} />
          </div>
        )}

        {/* Modal para ver lista de citas */}
        {showAppointmentsModal && (
          <AppointmentsList 
            appointments={isAllView ? upcomingAppointments : selectedDateAppointments} 
            onClose={handleCloseAppointmentsModal}
            onSelectAppointment={handleAppointmentSelect}
            date={date}
            isAllView={isAllView}
          />
        )}

        {/* Modal para ver detalles de cita */}
        {showAppointmentDetailModal && selectedAppointment && (
          <div className="modal-overlay">
            <div className="modal-container">
              <AppointmentDetails 
                appointment={selectedAppointment}
                onClose={handleCloseAppointmentDetailModal}
                onCancel={handleCancelAppointment}
                onComplete={handleCompleteAppointment}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            </div>
          </div>
        )}
      </div>
    </BookingRulesProvider>
  );
};

export default AppointmentManager;
