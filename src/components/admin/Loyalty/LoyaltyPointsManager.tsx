import React, { useState, useEffect } from 'react';
import { useLoyalty } from '../../../contexts/LoyaltyContext';
import { useAppointments } from '../../../contexts/AppointmentContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

interface LoyaltyPointsManagerProps {
  isAdminAuthenticated: boolean;
}

const LoyaltyPointsManager: React.FC<LoyaltyPointsManagerProps> = ({ isAdminAuthenticated }) => {
  const { loyaltyPoints, loading, error, addPointsForAppointment } = useLoyalty();
  const { appointments } = useAppointments();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredClients, setFilteredClients] = useState<typeof loyaltyPoints>([]);

  // Filtrar clientes por término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(loyaltyPoints);
    } else {
      const filtered = loyaltyPoints.filter(
        client => 
          client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.client_phone.includes(searchTerm)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, loyaltyPoints]);

  // Función para añadir puntos a una cita completada
  const handleAddPoints = async (appointmentId: string) => {
    const appointment = appointments.find(app => app.id === appointmentId);
    if (!appointment) return;

    try {
      await addPointsForAppointment(appointment);
    } catch (error) {
      console.error('Error al añadir puntos:', error);
      toast.error('Error al añadir puntos de fidelidad');
    }
  };

  // Función para obtener información de la última cita de un cliente
  const getLastAppointmentInfo = (appointmentId?: string) => {
    if (!appointmentId) return null;
    
    const appointment = appointments.find(app => app.id === appointmentId);
    return appointment ? {
      serviceName: appointment.services?.name || 'Servicio no especificado',
      date: appointment.date,
      time: appointment.time
    } : null;
  };

  if (loading) {
    return <div className="loading">Cargando datos de fidelización...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="loyalty-points-manager">
      <h2>Gestión de Puntos de Fidelidad</h2>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="clients-list">
        {filteredClients.length > 0 ? (
          filteredClients.map(client => {
            const lastAppointment = getLastAppointmentInfo(client.last_appointment_id);

            return (
              <div key={client.id} className="client-card">
                <div className="client-info">
                  <h3>{client.client_name}</h3>
                  <p>Teléfono: {client.client_phone}</p>
                  <p className="points">Puntos actuales: <span>{client.points}</span></p>
                  <p>Total acumulado: {client.total_earned}</p>
                  {lastAppointment && (
                    <div className="last-appointment">
                      <p>Última visita: {format(parseISO(lastAppointment.date), 'PPP', { locale: es })}</p>
                      <p>Servicio: {lastAppointment.serviceName}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-data">
            {searchTerm ? 'No se encontraron clientes con ese criterio' : 'No hay clientes con puntos de fidelidad'}
          </p>
        )}
      </div>

      <div className="appointments-without-points">
        <h3>Citas completadas sin puntos añadidos</h3>
        <div className="appointments-list">
          {appointments
            .filter(app => app.status === 'completed' && !app.loyalty_points_added)
            .map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-info">
                  <h4>{appointment.client_name}</h4>
                  <p>Teléfono: {appointment.client_phone}</p>
                  <p>Servicio: {appointment.services?.name || 'No especificado'}</p>
                  <p>Fecha: {format(parseISO(appointment.date), 'PPP', { locale: es })}</p>
                </div>
                <div className="appointment-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleAddPoints(appointment.id)}
                  >
                    Añadir Puntos
                  </button>
                </div>
              </div>
            ))
          }
          {appointments.filter(app => app.status === 'completed' && !app.loyalty_points_added).length === 0 && (
            <p className="no-data">Todas las citas completadas ya tienen puntos añadidos</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPointsManager;
