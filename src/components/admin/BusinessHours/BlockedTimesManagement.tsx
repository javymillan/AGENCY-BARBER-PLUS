import React, { useState } from 'react';
import { BlockedTime } from '../../../types';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface BlockedTimesManagementProps {
  blockedTimes: BlockedTime[];
  onAddBlockedTime: (blockedTime: Omit<BlockedTime, 'id'>) => Promise<void>;
  onDeleteBlockedTime: (blockedTimeId: string) => Promise<void>;
  isAdminAuthenticated: boolean; // Mantenemos el prop pero no lo usamos para restricciones
}

const BlockedTimesManagement: React.FC<BlockedTimesManagementProps> = ({
  blockedTimes,
  onAddBlockedTime,
  onDeleteBlockedTime,
  isAdminAuthenticated // No se usa para restricciones
}) => {
  const [newBlockedTime, setNewBlockedTime] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '',
    end_time: '',
    reason: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewBlockedTime(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddBlockedTime(newBlockedTime);
    setNewBlockedTime({
      date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '',
      end_time: '',
      reason: ''
    });
  };

  const handleDelete = async (blockedTimeId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este tiempo bloqueado?')) {
      await onDeleteBlockedTime(blockedTimeId);
    }
  };

  // Agrupar tiempos bloqueados por fecha
  const groupedBlockedTimes = blockedTimes.reduce<Record<string, BlockedTime[]>>((acc, time) => {
    if (!acc[time.date]) {
      acc[time.date] = [];
    }
    acc[time.date].push(time);
    return acc;
  }, {});

  return (
    <div className="blocked-times-container">
      <h2>Tiempos Bloqueados</h2>

      {/* Formulario disponible para TODOS los usuarios */}
      <form onSubmit={handleSubmit} className="blocked-time-form">
        <div className="form-group">
          <label htmlFor="date">Fecha:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={newBlockedTime.date}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start_time">Hora de inicio:</label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              value={newBlockedTime.start_time}
              onChange={handleInputChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="end_time">Hora de fin:</label>
            <input
              type="time"
              id="end_time"
              name="end_time"
              value={newBlockedTime.end_time}
              onChange={handleInputChange}
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reason">Motivo:</label>
          <textarea
            id="reason"
            name="reason"
            value={newBlockedTime.reason}
            onChange={handleInputChange}
            className="form-control"
            rows={2}
          ></textarea>
        </div>

        <button type="submit" className="btn btn-primary">
          Agregar Tiempo Bloqueado
        </button>
      </form>

      <div className="blocked-times-list">
        {Object.entries(groupedBlockedTimes).length === 0 ? (
          <p className="no-blocked-times">No hay tiempos bloqueados configurados.</p>
        ) : (
          Object.entries(groupedBlockedTimes).map(([date, times]) => (
            <div key={date} className="blocked-date-group">
              <h3 className="blocked-date">{date}</h3>
              <div className="blocked-times-group">
                {times.map(time => (
                  <div key={time.id} className="blocked-time-card">
                    <div className="blocked-time-info">
                      <div className="blocked-time-range">
                        {time.start_time} - {time.end_time}
                      </div>
                      {time.reason && (
                        <div className="blocked-time-reason">
                          {time.reason}
                        </div>
                      )}
                    </div>
                    {/* Botón disponible para TODOS los usuarios */}
                    <button 
                      className="btn btn-sm btn-outline-danger delete-blocked-time-btn"
                      onClick={() => handleDelete(time.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlockedTimesManagement;
