import React, { useState } from 'react';
import { Service } from '../../../types';
import { useAppointments } from '../../../contexts/AppointmentContext';
import { useServices } from '../../../contexts/ServiceContext';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

interface TimeSlot {
  time: string;
  available: boolean;
  message: string;
  spacesAvailable: number;
}

interface AppointmentFormProps {
  onClose: () => void;
  selectedDate: Date;
  selectedService: Service;
  availableTimeSlots: TimeSlot[];
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onClose,
  selectedDate,
  selectedService,
  availableTimeSlots
}) => {
  const { createAppointment } = useAppointments();
  const { services } = useServices();
  
  const [newAppointment, setNewAppointment] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    service_id: selectedService.id,
    time: '',
    notes: ''
  });

  // Función para manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const appointmentData = {
        client_name: newAppointment.client_name,
        client_phone: newAppointment.client_phone,
        client_email: newAppointment.client_email || undefined,
        service_id: selectedService.id,
        date: dateStr,
        time: newAppointment.time,
        status: 'pending',
        notes: newAppointment.notes || undefined
      };
      
      const result = await createAppointment(appointmentData);
      
      if (result) {
        toast.success('Cita reservada correctamente');
        onClose();
      }
    } catch (error) {
      toast.error('Error al crear la cita');
      console.error('Error al crear la cita:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="appointment-form">
      <div className="form-group">
        <label htmlFor="client_name">Nombre:</label>
        <input
          type="text"
          id="client_name"
          name="client_name"
          value={newAppointment.client_name}
          onChange={handleInputChange}
          required
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label htmlFor="client_phone">Teléfono:</label>
        <input
          type="tel"
          id="client_phone"
          name="client_phone"
          value={newAppointment.client_phone}
          onChange={handleInputChange}
          required
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label htmlFor="client_email">Email:</label>
        <input
          type="email"
          id="client_email"
          name="client_email"
          value={newAppointment.client_email}
          onChange={handleInputChange}
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label htmlFor="service_id">Servicio:</label>
        <div className="selected-service">
          <strong>{selectedService.name}</strong> - ${selectedService.price} ({selectedService.duration} min)
        </div>
        <input
          type="hidden"
          id="service_id"
          name="service_id"
          value={selectedService.id}
        />
      </div>

      {newAppointment.service_id && (
        <div className="form-group">
          <label htmlFor="time">Hora:</label>
          <div className="time-slots-container">
            {availableTimeSlots.length > 0 ? (
              availableTimeSlots.map(slot => (
                <button
                  key={slot.time}
                  type="button"
                  className={`time-slot ${slot.available ? 'available' : 'unavailable'} ${newAppointment.time === slot.time ? 'selected' : ''}`}
                  onClick={() => {
                    if (slot.available) {
                      setNewAppointment(prev => ({ ...prev, time: slot.time }));
                    }
                  }}
                  disabled={!slot.available}
                >
                  <span className="time">{slot.time}</span>
                  <span className="message">{slot.message}</span>
                </button>
              ))
            ) : (
              <p className="no-times-message">No hay horarios disponibles para este día o servicio.</p>
            )}
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="notes">Notas:</label>
        <textarea
          id="notes"
          name="notes"
          value={newAppointment.notes}
          onChange={handleInputChange}
          className="form-control"
          rows={3}
        ></textarea>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={!newAppointment.client_name || !newAppointment.client_phone || !newAppointment.service_id || !newAppointment.time}
      >
        Reservar Cita
      </button>
    </form>
  );
};

export default AppointmentForm;
