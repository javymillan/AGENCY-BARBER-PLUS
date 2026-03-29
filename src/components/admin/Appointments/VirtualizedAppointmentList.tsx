import React, { useMemo } from 'react';
import { Appointment } from '../../../types';
import { format } from 'date-fns';
import './VirtualizedAppointmentList.css';

interface VirtualizedAppointmentListProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  height?: number;
  width?: number;
  itemSize?: number;
}

const VirtualizedAppointmentList: React.FC<VirtualizedAppointmentListProps> = ({
  appointments,
  onSelectAppointment,
  height = 400,
  width = '100%',
  itemSize = 80,
}) => {
  // Memoizar la lista de citas para evitar renderizados innecesarios
  const memoizedAppointments = useMemo(() => appointments, [appointments]);

  return (
    <div className="virtualized-appointment-list" style={{ height, width, overflowY: 'auto' }}>
      {memoizedAppointments.length > 0 ? (
        <div style={{ position: 'relative', width: '100%' }}>
          {memoizedAppointments.map((appointment, index) => {
            const formattedDate = format(new Date(appointment.date), 'dd/MM/yyyy');
            return (
              <div 
                key={appointment.id || index}
                className="appointment-item" 
                style={{ height: itemSize, display: 'flex', alignItems: 'center', width: '100%', boxSizing: 'border-box' }} 
                onClick={() => onSelectAppointment(appointment)}
              >
                <div className="appointment-info" style={{ width: '100%' }}>
                  <div className="appointment-header">
                    <span className="appointment-time">{appointment.time}</span>
                    <span className="appointment-date">{formattedDate}</span>
                  </div>
                  <div className="appointment-details">
                    <span className="appointment-client">{appointment.client_name}</span>
                    <span className="appointment-service">{appointment.services?.name || 'Servicio no especificado'}</span>
                  </div>
                  <div className="appointment-status">
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status === 'completed' ? 'Completada' : 
                       appointment.status === 'confirmed' ? 'Confirmada' : 
                       appointment.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-appointments">No hay citas para mostrar</div>
      )}
    </div>
  );
};

export default VirtualizedAppointmentList;
