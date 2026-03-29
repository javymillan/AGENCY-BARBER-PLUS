import React from 'react';
import { Service, Appointment } from '../../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Calendar, Clock, User, Phone, Mail, DollarSign, Edit, MessageCircle } from 'lucide-react';

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

interface BookingConfirmationProps {
  bookingData: BookingData;
  onConfirm: () => void;
  onEdit: () => void;
  loading: boolean;
  confirmedAppointment: Appointment | null;
  finalPrice?: number;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  bookingData,
  onConfirm,
  onEdit,
  loading,
  confirmedAppointment,
  finalPrice
}) => {
  const formatDate = (date: Date) => {
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  const generateWhatsAppLink = () => {
    let phone = bookingData.clientData.phone.replace(/\D/g, '');
    if (!phone.startsWith('52')) {
      phone = '52' + phone;
    }
    const date = format(bookingData.date!, "dd/MM/yyyy", { locale: es });
    const serviceName = bookingData.service?.name || 'Servicio';
    const duration = bookingData.service?.duration || 0;
    const price = finalPrice !== undefined ? finalPrice : (bookingData.service?.price || 0);
    const originalPrice = bookingData.service?.price || 0;

    // Format price for message (show discount if applicable)
    let priceText = `$${price}`;
    if (finalPrice !== undefined && finalPrice < originalPrice) {
      priceText = `$${price} (Precio original: $${originalPrice})`;
    }

    const googleCalendarLink = generateGoogleCalendarLink();

    const message = `Hola ${bookingData.clientData.name}, confirmo tu cita:
📅 Fecha: ${date}
⏰ Hora: ${bookingData.timeSlot}
💇 Servicio: ${serviceName}
⏱️ Duración: ${duration} minutos
💰 Precio: ${priceText}

📱 Agrega tu cita a Google Calendar:
${googleCalendarLink}

¡Te esperamos!`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  const generateGoogleCalendarLink = () => {
    const startDate = new Date(bookingData.date!);
    const [hours, minutes] = bookingData.timeSlot!.split(':');
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + (bookingData.service?.duration || 30));

    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const serviceName = bookingData.service?.name || 'Cita';
    const eventTitle = `${serviceName} - ${bookingData.clientData.name}`;
    const description = `Cliente: ${bookingData.clientData.name}
Servicio: ${serviceName}
Teléfono: ${bookingData.clientData.phone}${bookingData.clientData.notes ? '\nNotas: ' + bookingData.clientData.notes : ''}`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: eventTitle,
      dates: `${formatDateTime(startDate)}/${formatDateTime(endDate)}`,
      details: description,
      location: 'Barbería'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  if (confirmedAppointment) {
    return (
      <div className="booking-success">
        <div className="success-icon">
          <CheckCircle size={64} />
        </div>

        <h3>¡Cita confirmada exitosamente!</h3>

        <div className="confirmation-details">
          <div className="detail-item">
            <Calendar size={20} />
            <div>
              <strong>Fecha y hora</strong>
              <p>{formatDate(bookingData.date!)} a las {bookingData.timeSlot}</p>
            </div>
          </div>

          <div className="detail-item">
            <User size={20} />
            <div>
              <strong>Servicio</strong>
              <p>{bookingData.service!.name}</p>
            </div>
          </div>

          <div className="detail-item">
            <Phone size={20} />
            <div>
              <strong>Cliente</strong>
              <p>{bookingData.clientData.name}</p>
              <p>{bookingData.clientData.phone}</p>
            </div>
          </div>
        </div>

        <div className="success-message">
          <p>
            Hemos registrado tu cita. Te contactaremos pronto para confirmar
            los detalles finales.
          </p>
        </div>

        <div className="confirmation-links">
          <a
            href={generateWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="confirmation-link"
          >
            <MessageCircle size={20} />
            Confirmar por WhatsApp
          </a>
          <a
            href={generateGoogleCalendarLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="confirmation-link"
          >
            <Calendar size={20} />
            Guardar en Google Calendar
          </a>
        </div>

        <div className="success-actions">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reservar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-confirmation">
      <h3>Confirma tu reserva</h3>
      <p className="confirmation-description">
        Revisa los detalles de tu cita antes de confirmar
      </p>

      <div className="confirmation-summary">
        <div className="summary-section">
          <h4>
            <Calendar size={20} />
            Detalles de la cita
          </h4>
          <div className="summary-details">
            <div className="detail-row">
              <span className="label">Servicio:</span>
              <span className="value">{bookingData.service!.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Fecha:</span>
              <span className="value">{formatDate(bookingData.date!)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Hora:</span>
              <span className="value">{bookingData.timeSlot}</span>
            </div>
            <div className="detail-row">
              <span className="label">Duración:</span>
              <span className="value">{bookingData.service!.duration} minutos</span>
            </div>
            <div className="detail-row">
              <span className="label">Precio:</span>
              <span className="value price">${finalPrice !== undefined ? finalPrice : bookingData.service!.price}</span>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h4>
            <User size={20} />
            Datos del cliente
            <button className="edit-btn" onClick={onEdit}>
              <Edit size={16} />
              Editar
            </button>
          </h4>
          <div className="summary-details">
            <div className="detail-row">
              <span className="label">Nombre:</span>
              <span className="value">{bookingData.clientData.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Teléfono:</span>
              <span className="value">{bookingData.clientData.phone}</span>
            </div>
            {bookingData.clientData.email && (
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{bookingData.clientData.email}</span>
              </div>
            )}
            {bookingData.clientData.notes && (
              <div className="detail-row">
                <span className="label">Notas:</span>
                <span className="value">{bookingData.clientData.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="confirmation-actions">
        <button
          className="btn btn-primary confirm-btn"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="loading-spinner small"></div>
              Confirmando...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Confirmar reserva
            </>
          )}
        </button>
      </div>

      <div className="terms-notice">
        <p>
          Al confirmar tu reserva, aceptas nuestros términos y condiciones.
          Te contactaremos para confirmar los detalles finales.
        </p>
      </div>
    </div>
  );
};

export default BookingConfirmation;
