import React, { useState, useEffect, useCallback } from 'react';
import { Service, Appointment } from '../../../types';
import { useServices } from '../../../contexts/ServiceContext';
import { useAppointments } from '../../../contexts/AppointmentContext';
import { useBusinessHours } from '../../../contexts/BusinessHoursContext';
import { useBookingRules } from '../../../contexts/BookingRulesContext';
import ServiceSelector from './ServiceSelector';
import TimeSlotSelector from './TimeSlotSelector';
import ClientForm from './ClientForm';
import BookingConfirmation from './BookingConfirmation';
import { Calendar } from 'react-calendar';
import { format, addDays, isSameDay, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, CheckCircle, Tag } from 'lucide-react';
import { calculateServicePrice } from '../../../lib/promotions';
import './BookingFlow.css';

interface BookingFlowProps {
  onClose: () => void;
}

interface BookingData {
  service: Service | null;
  date: Date | null;
  timeSlot: string | null;
  clientData: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
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

type BookingStep = 'service' | 'date' | 'time' | 'client' | 'confirmation';

const BookingFlow: React.FC<BookingFlowProps> = ({ onClose }) => {
  const { services } = useServices();
  const { createAppointment, fetchAppointments } = useAppointments();
  const { businessHours, blockedTimes } = useBusinessHours();
  const { bookingRules, getAvailableTimeSlots, getDetailedTimeSlots } = useBookingRules();

  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [bookingData, setBookingData] = useState<BookingData>({
    service: null,
    date: null,
    timeSlot: null,
    clientData: {
      name: '',
      phone: '',
      email: '',
      notes: ''
    }
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [timeSlotDetails, setTimeSlotDetails] = useState<TimeSlotInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Calcular precio con promociones
  const priceInfo = React.useMemo(() => {
    if (!bookingData.service) return null;
    return calculateServicePrice(bookingData.service, bookingData.date || new Date());
  }, [bookingData.service, bookingData.date]);

  // Calcular fecha mínima (según reglas de negocio)
  const getMinDate = useCallback(() => {
    // Si no hay reglas cargadas todavía, permitir desde hoy
    if (!bookingRules?.min_advance_time) return new Date();
    const now = new Date();
    const minAdvanceHours = bookingRules.min_advance_time;
    // Solo bloquear días si el advance mínimo es >= 24h
    if (minAdvanceHours < 24) return now;
    return addDays(now, Math.ceil(minAdvanceHours / 24));
  }, [bookingRules]);

  // Calcular fecha máxima (opcional, basado en reglas)
  const getMaxDate = useCallback(() => {
    const now = new Date();
    return addDays(now, 90); // 3 meses adelante por defecto
  }, []);

  // Verificar si una fecha está disponible
  const isDateAvailable = useCallback((date: Date) => {
    const dayOfWeek = date.getDay();

    // Si los horarios de negocio aún no han cargado, permitir todos los días
    if (businessHours.length === 0) return true;

    const businessHour = businessHours.find(h => h.day_of_week === dayOfWeek);

    // Si no hay registro para el día, permitirlo (no bloquearlo)
    if (!businessHour) return true;

    // Solo bloquear si explícitamente está marcado como cerrado
    if (businessHour.is_closed) return false;

    // Verificar si la fecha está en el rango permitido
    const minDate = getMinDate();
    const maxDate = getMaxDate();
    if (isBefore(date, new Date(minDate.toDateString())) || isAfter(date, maxDate)) {
      return false;
    }

    // Verificar si hay tiempos bloqueados para TODA la jornada de esa fecha
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasFullDayBlock = blockedTimes.some(
      blocked => blocked.date === dateStr && !blocked.start_time
    );

    return !hasFullDayBlock;
  }, [businessHours, blockedTimes, getMinDate, getMaxDate]);

  // Cargar horarios disponibles cuando se selecciona fecha y servicio
  const loadAvailableTimeSlots = useCallback(async () => {
    if (!bookingData.service || !bookingData.date) return;

    setLoading(true);
    try {
      // Obtener tanto los slots disponibles como la información detallada
      const [slots, details] = await Promise.all([
        getAvailableTimeSlots(
          bookingData.date,
          bookingData.service.id,
          bookingData.service.duration
        ),
        getDetailedTimeSlots(
          bookingData.date,
          bookingData.service.id,
          bookingData.service.duration
        )
      ]);

      setAvailableTimeSlots(slots);
      setTimeSlotDetails(details);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      toast.error('Error al cargar horarios disponibles');
      setAvailableTimeSlots([]);
      setTimeSlotDetails([]);
    } finally {
      setLoading(false);
    }
  }, [bookingData.service, bookingData.date, getAvailableTimeSlots, getDetailedTimeSlots]);

  // Efecto para cargar horarios cuando cambia servicio o fecha
  useEffect(() => {
    if (currentStep === 'time' && bookingData.service && bookingData.date) {
      loadAvailableTimeSlots();
    }
  }, [currentStep, loadAvailableTimeSlots]);

  // Manejar selección de servicio
  const handleServiceSelect = (service: Service) => {
    setBookingData(prev => ({
      ...prev,
      service,
      date: null,
      timeSlot: null
    }));
    setCurrentStep('date');
  };

  // Manejar selección de fecha
  const handleDateSelect = (date: Date) => {
    if (!isDateAvailable(date)) {
      toast.warning('Esta fecha no está disponible');
      return;
    }

    setBookingData(prev => ({
      ...prev,
      date,
      timeSlot: null
    }));
    setCurrentStep('time');
  };

  // Manejar selección de horario - AQUÍ SE SELECCIONA UNA SOLA VEZ
  const handleTimeSlotSelect = (timeSlot: string) => {
    setBookingData(prev => ({
      ...prev,
      timeSlot
    }));
    // Ir directamente al formulario de cliente, NO volver a pedir horario
    setCurrentStep('client');
  };

  // Manejar datos del cliente
  const handleClientDataSubmit = (clientData: BookingData['clientData']) => {
    setBookingData(prev => ({
      ...prev,
      clientData
    }));
    setCurrentStep('confirmation');
  };

  // Confirmar reserva - MEJORADO para asegurar recarga de datos
  const handleConfirmBooking = async () => {
    if (!bookingData.service || !bookingData.date || !bookingData.timeSlot) {
      toast.error('Faltan datos para completar la reserva');
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        client_name: bookingData.clientData.name,
        client_phone: bookingData.clientData.phone,
        client_email: bookingData.clientData.email || undefined,
        service_id: bookingData.service.id,
        date: format(bookingData.date, 'yyyy-MM-dd'),
        time: bookingData.timeSlot,
        status: 'pending' as const,
        notes: bookingData.clientData.notes || undefined
      };

      console.log('Enviando datos de cita:', appointmentData);

      const newAppointment = await createAppointment(appointmentData);

      if (newAppointment) {
        console.log('Cita creada exitosamente:', newAppointment);
        setConfirmedAppointment(newAppointment);
        toast.success('¡Cita reservada exitosamente!');

        // Forzar recarga de citas para asegurar que se muestren con información completa
        setTimeout(() => {
          fetchAppointments();
        }, 1000);
      } else {
        throw new Error('No se pudo crear la cita');
      }
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      toast.error('Error al confirmar la reserva. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Navegar hacia atrás
  const handleGoBack = () => {
    switch (currentStep) {
      case 'date':
        setCurrentStep('service');
        break;
      case 'time':
        setCurrentStep('date');
        break;
      case 'client':
        setCurrentStep('time');
        break;
      case 'confirmation':
        setCurrentStep('client');
        break;
      default:
        onClose();
    }
  };

  // Renderizar indicador de progreso
  const renderProgressIndicator = () => {
    const steps = [
      { key: 'service', label: 'Servicio', icon: <User size={16} /> },
      { key: 'date', label: 'Fecha', icon: <CalendarIcon size={16} /> },
      { key: 'time', label: 'Hora', icon: <Clock size={16} /> },
      { key: 'client', label: 'Datos', icon: <User size={16} /> },
      { key: 'confirmation', label: 'Confirmar', icon: <CheckCircle size={16} /> }
    ];

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="progress-indicator">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={`progress-step ${index <= currentIndex ? 'active' : ''} ${index < currentIndex ? 'completed' : ''}`}
          >
            <div className="step-icon">
              {step.icon}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="booking-flow">
      <div className="booking-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          Atrás
        </button>
        <h2>Reservar Cita</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      {renderProgressIndicator()}

      <div className="booking-content">
        {currentStep === 'service' && (
          <ServiceSelector
            services={services}
            onServiceSelect={handleServiceSelect}
            selectedService={bookingData.service}
          />
        )}

        {currentStep === 'date' && bookingData.service && (
          <div className="date-selection">
            <h3>Selecciona la fecha para tu cita</h3>
            <p className="service-info">
              Servicio: <strong>{bookingData.service.name}</strong>
              ({bookingData.service.duration} min - ${bookingData.service.price})
            </p>
            <Calendar
              onChange={(value) => {
                if (value instanceof Date) {
                  handleDateSelect(value);
                } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof Date) {
                  handleDateSelect(value[0]);
                }
              }}
              value={bookingData.date}
              minDate={getMinDate()}
              maxDate={getMaxDate()}
              tileDisabled={({ date }) => !isDateAvailable(date)}
              locale="es-ES"
              calendarType="gregory" // Esto hace que el calendario empiece por domingo
              className="booking-calendar"
            />
          </div>
        )}

        {currentStep === 'time' && bookingData.service && bookingData.date && (
          <TimeSlotSelector
            service={bookingData.service}
            date={bookingData.date}
            availableSlots={availableTimeSlots}
            selectedSlot={bookingData.timeSlot}
            onSlotSelect={handleTimeSlotSelect}
            loading={loading}
            timeSlotDetails={timeSlotDetails}
          />
        )}

        {currentStep === 'client' && (
          <div className="client-form-with-summary">
            {/* Mostrar resumen de la selección antes del formulario */}
            <div className="booking-summary-header">
              <h3>Completa tus datos</h3>
              <div className="selected-booking-info">
                <div className="summary-item">
                  <strong>Servicio:</strong> {bookingData.service?.name}
                </div>
                <div className="summary-item">
                  <strong>Fecha:</strong> {bookingData.date && format(bookingData.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
                <div className="summary-item">
                  <strong>Hora:</strong> {bookingData.timeSlot}
                </div>
                <div className="summary-item">
                  <strong>Precio:</strong>
                  {priceInfo?.discountApplied ? (
                    <span>
                      <span style={{ textDecoration: 'line-through', marginRight: '8px', opacity: 0.7 }}>${priceInfo.originalPrice}</span>
                      <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>
                        ${priceInfo.finalPrice}
                        <span style={{ fontSize: '0.8em', marginLeft: '4px' }}>
                          ({priceInfo.discountApplied.name})
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span>${bookingData.service?.price}</span>
                  )}
                </div>
              </div>
            </div>

            <ClientForm
              initialData={bookingData.clientData}
              onSubmit={handleClientDataSubmit}
            />
          </div>
        )}

        {currentStep === 'confirmation' && (
          <BookingConfirmation
            bookingData={bookingData}
            onConfirm={handleConfirmBooking}
            onEdit={() => setCurrentStep('client')}
            loading={loading}
            confirmedAppointment={confirmedAppointment}
            finalPrice={priceInfo?.finalPrice}
          />
        )}
      </div>
    </div>
  );
};

export default BookingFlow;
