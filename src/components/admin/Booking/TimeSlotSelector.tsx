import React from 'react';
import { Service } from '../../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Users, CheckCircle } from 'lucide-react';

interface TimeSlotInfo {
  time: string;
  availableSpaces: number;
  totalCapacity: number;
  maxDuration: number;
  isAvailable: boolean;
  message: string;
}

interface TimeSlotSelectorProps {
  service: Service;
  date: Date;
  availableSlots: string[];
  selectedSlot: string | null;
  onSlotSelect: (slot: string) => void;
  loading: boolean;
  timeSlotDetails?: TimeSlotInfo[];
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  service,
  date,
  availableSlots,
  selectedSlot,
  onSlotSelect,
  loading,
  timeSlotDetails = []
}) => {
  const formatDate = (date: Date) => {
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Crear información detallada para slots disponibles si no se proporciona
  const getSlotDetails = (slot: string): TimeSlotInfo => {
    const existing = timeSlotDetails.find(detail => detail.time === slot);
    if (existing) return existing;
    
    // Valores por defecto si no hay información detallada
    return {
      time: slot,
      availableSpaces: 1,
      totalCapacity: 1,
      maxDuration: service.duration,
      isAvailable: true,
      message: '1 espacio disponible'
    };
  };

  const getSpaceIndicator = (availableSpaces: number, totalCapacity: number) => {
    const percentage = (availableSpaces / totalCapacity) * 100;
    
    if (percentage === 100) return { color: 'success', text: 'Disponible' };
    if (percentage >= 50) return { color: 'warning', text: 'Pocos espacios' };
    if (percentage > 0) return { color: 'danger', text: 'Último espacio' };
    return { color: 'unavailable', text: 'No disponible' };
  };

  return (
    <div className="time-slot-selector">
      <h3>Selecciona el horario</h3>
      
      <div className="booking-summary">
        <div className="summary-item">
          <strong>Servicio:</strong> {service.name}
        </div>
        <div className="summary-item">
          <strong>Fecha:</strong> {formatDate(date)}
        </div>
        <div className="summary-item">
          <strong>Duración:</strong> {service.duration} minutos
        </div>
        <div className="summary-item">
          <strong>Precio:</strong> ${service.price}
        </div>
      </div>

      {loading ? (
        <div className="loading-slots">
          <div className="loading-spinner"></div>
          <p>Cargando horarios disponibles...</p>
        </div>
      ) : (
        <>
          {availableSlots.length > 0 ? (
            <>
              <div className="capacity-legend">
                <h4>Leyenda de disponibilidad:</h4>
                <div className="legend-items">
                  <div className="legend-item success">
                    <div className="legend-color"></div>
                    <span>Totalmente disponible</span>
                  </div>
                  <div className="legend-item warning">
                    <div className="legend-color"></div>
                    <span>Pocos espacios</span>
                  </div>
                  <div className="legend-item danger">
                    <div className="legend-color"></div>
                    <span>Último espacio</span>
                  </div>
                </div>
              </div>

              <div className="time-slots-grid">
                {availableSlots.map(slot => {
                  const slotDetails = getSlotDetails(slot);
                  const indicator = getSpaceIndicator(slotDetails.availableSpaces, slotDetails.totalCapacity);
                  
                  return (
                    <button
                      key={slot}
                      className={`time-slot ${selectedSlot === slot ? 'selected' : ''} ${indicator.color}`}
                      onClick={() => onSlotSelect(slot)}
                    >
                      <div className="slot-time">
                        <Clock size={16} />
                        <span className="time-text">{slot}</span>
                      </div>
                      
                      <div className="slot-capacity">
                        <Users size={14} />
                        <span className="capacity-text">
                          {slotDetails.availableSpaces}/{slotDetails.totalCapacity} espacios
                        </span>
                      </div>
                      
                      <div className="slot-status">
                        <span className={`status-indicator ${indicator.color}`}>
                          {indicator.text}
                        </span>
                      </div>
                      
                      {slotDetails.maxDuration !== service.duration && (
                        <div className="duration-warning">
                          <span>Máx: {slotDetails.maxDuration} min</span>
                        </div>
                      )}
                      
                      {selectedSlot === slot && (
                        <div className="selected-indicator">
                          <CheckCircle size={16} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="availability-summary">
                <h4>Resumen de disponibilidad:</h4>
                <div className="summary-stats">
                  <div className="stat-item">
                    <strong>{availableSlots.length}</strong>
                    <span>Horarios disponibles</span>
                  </div>
                  <div className="stat-item">
                    <strong>
                      {timeSlotDetails.reduce((total, slot) => total + slot.availableSpaces, 0) || availableSlots.length}
                    </strong>
                    <span>Espacios totales</span>
                  </div>
                  <div className="stat-item">
                    <strong>{service.duration} min</strong>
                    <span>Duración del servicio</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-slots">
              <Users size={48} />
              <h4>No hay horarios disponibles</h4>
              <p>
                No hay espacios disponibles para este día. 
                Esto puede deberse a:
              </p>
              <ul className="no-slots-reasons">
                <li>Todos los empleados están ocupados</li>
                <li>Horarios de descanso o cierre</li>
                <li>Tiempos bloqueados por mantenimiento</li>
                <li>Capacidad máxima alcanzada</li>
              </ul>
              <p>Por favor, selecciona otra fecha.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TimeSlotSelector;
