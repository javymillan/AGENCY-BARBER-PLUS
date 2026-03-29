import React from 'react';
import { Appointment } from '../../../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User, Phone, Mail, Scissors, MessageCircle, X } from 'lucide-react';
import './AppointmentDetails.css';

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
  onCancel: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
  isAdminAuthenticated: boolean; // Mantenemos el prop pero no lo usamos para restricciones
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointment,
  onClose,
  onCancel,
  onComplete,
  isAdminAuthenticated // No se usa para restricciones
}) => {
  // Función para generar mensaje de WhatsApp
  const generateWhatsAppMessage = () => {
    const appointmentDate = format(parseISO(appointment.date), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es });
    const serviceName = appointment.services?.name || 'Servicio';
    
    return encodeURIComponent(
      `¡Hola ${appointment.client_name}! 👋\n\n` +
      `Te recordamos tu cita programada:\n\n` +
      `📅 Fecha: ${appointmentDate}\n` +
      `🕐 Hora: ${appointment.time}\n` +
      `✂️ Servicio: ${serviceName}\n\n` +
      `¡Te esperamos! Si necesitas hacer algún cambio, no dudes en contactarnos.`
    );
  };

  // Función para generar asunto y cuerpo del email
  const generateEmailContent = () => {
    const appointmentDate = format(parseISO(appointment.date), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es });
    const serviceName = appointment.services?.name || 'Servicio';
    
    const subject = encodeURIComponent(`Confirmación de cita - ${appointmentDate}`);
    const body = encodeURIComponent(
      `Estimado/a ${appointment.client_name},\n\n` +
      `Le confirmamos su cita programada con los siguientes detalles:\n\n` +
      `Fecha: ${appointmentDate}\n` +
      `Hora: ${appointment.time}\n` +
      `Servicio: ${serviceName}\n` +
      `Duración estimada: ${appointment.services?.duration || 30} minutos\n\n` +
      `Si necesita realizar algún cambio o tiene alguna consulta, no dude en contactarnos.\n\n` +
      `¡Esperamos verle pronto!\n\n` +
      `Saludos cordiales,\n` +
      `El equipo de ESTETICA Profesional`
    );
    
    return { subject, body };
  };

  const handleWhatsAppClick = () => {
    const message = generateWhatsAppMessage();
    let phone = appointment.client_phone.replace(/\D/g, '');
    if (!phone.startsWith('52')) {
      phone = '52' + phone;
    }
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailClick = () => {
    const { subject, body } = generateEmailContent();
    const emailUrl = `mailto:${appointment.client_email || ''}?subject=${subject}&body=${body}`;
    window.open(emailUrl, '_blank');
  };

  return (
    <div className="appointment-details-modal">
      <div className="appointment-details-container">
        {/* Header con botón de cerrar */}
        <div className="modal-header">
          <h2>Detalles de la Cita</h2>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        {/* Contenido principal */}
        <div className="appointment-details-content">
          {/* Información de la cita */}
          <div className="appointment-info-section">
            <h3>Información de la Cita</h3>
            
            <div className="info-list">
              <div className="info-row">
                <Calendar size={18} />
                <span className="info-label">Fecha:</span>
                <span className="info-value">
                  {format(parseISO(appointment.date), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </span>
              </div>

              <div className="info-row">
                <Clock size={18} />
                <span className="info-label">Hora:</span>
                <span className="info-value">{appointment.time}</span>
              </div>

              <div className="info-row">
                <Scissors size={18} />
                <span className="info-label">Servicio:</span>
                <span className="info-value">{appointment.services?.name || 'No especificado'}</span>
              </div>

              <div className="info-row">
                <Clock size={18} />
                <span className="info-label">Duración:</span>
                <span className="info-value">{appointment.services?.duration || 30} minutos</span>
              </div>

              <div className="info-row">
                <span className="status-label">Estado:</span>
                <span className={`status-badge ${appointment.status}`}>
                  {appointment.status === 'completed' ? 'Completada' : 
                   appointment.status === 'confirmed' ? 'Confirmada' : 
                   appointment.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="client-info-section">
            <h3>Información del Cliente</h3>
            
            <div className="client-list">
              <div className="client-row">
                <User size={18} />
                <span className="client-label">Nombre:</span>
                <span className="client-value">{appointment.client_name}</span>
              </div>
              
              <div className="client-row">
                <Phone size={18} />
                <span className="client-label">Teléfono:</span>
                <span className="client-value">{appointment.client_phone}</span>
              </div>
              
              {appointment.client_email && (
                <div className="client-row">
                  <Mail size={18} />
                  <span className="client-label">Email:</span>
                  <span className="client-value">{appointment.client_email}</span>
                </div>
              )}
            </div>

            {/* Botones de contacto */}
            <div className="contact-buttons">
              <button 
                className="contact-btn whatsapp-btn"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle size={18} />
                <span>WhatsApp</span>
              </button>
              
              <button 
                className="contact-btn email-btn"
                onClick={handleEmailClick}
                disabled={!appointment.client_email}
              >
                <Mail size={18} />
                <span>Email</span>
              </button>
            </div>
          </div>

          {/* Notas adicionales */}
          {appointment.notes && (
            <div className="notes-section">
              <h3>Notas</h3>
              <p className="notes-content">{appointment.notes}</p>
            </div>
          )}

          {/* Acciones disponibles para TODOS los usuarios - SIN RESTRICCIONES */}
          <div className="admin-actions">
            {appointment.status === 'pending' && (
              <>
                <button 
                  className="action-btn complete-btn"
                  onClick={() => onComplete(appointment)}
                >
                  Marcar como Completada
                </button>
                <button 
                  className="action-btn cancel-btn"
                  onClick={() => onCancel(appointment)}
                >
                  Cancelar Cita
                </button>
              </>
            )}
            
            {appointment.status === 'completed' && (
              <button 
                className="action-btn revert-btn"
                onClick={() => onCancel(appointment)}
              >
                Revertir a Pendiente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
