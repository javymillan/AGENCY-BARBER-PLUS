import React, { useState } from 'react';
import { BusinessHours, DAYS_ES } from '../../../types';
import { Clock, Coffee, Edit2, X, Check } from 'lucide-react';

interface BusinessHoursManagementProps {
  businessHours: BusinessHours[];
  onUpdateBusinessHours: (hours: BusinessHours) => Promise<void>;
  isAdminAuthenticated: boolean;
}

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const BusinessHoursManagement: React.FC<BusinessHoursManagementProps> = ({
  businessHours,
  onUpdateBusinessHours,
}) => {
  const [editingHours, setEditingHours] = useState<BusinessHours | null>(null);
  const [saving, setSaving] = useState(false);

  // Ordenar por día de la semana
  const sorted = [...businessHours].sort((a, b) => a.day_of_week - b.day_of_week);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingHours) return;
    const { name, value, type, checked } = e.target;
    setEditingHours({
      ...editingHours,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHours) return;
    setSaving(true);
    await onUpdateBusinessHours(editingHours);
    setSaving(false);
    setEditingHours(null);
  };

  const fmt = (t: string) => t?.slice(0, 5) ?? '';

  return (
    <div className="bh-wrapper">
      <div className="bh-header">
        <Clock size={20} />
        <h2>Horarios de Negocio</h2>
      </div>

      {/* Grid compacto de 7 días */}
      <div className="bh-grid">
        {sorted.map(hours => (
          <div
            key={hours.day_of_week}
            className={`bh-day-card ${hours.is_closed ? 'bh-closed' : 'bh-open'}`}
          >
            {/* Cabecera del día */}
            <div className="bh-day-header">
              <span className="bh-day-name">{DAYS_SHORT[hours.day_of_week]}</span>
              <span className={`bh-status-dot ${hours.is_closed ? 'dot-closed' : 'dot-open'}`} />
            </div>

            {/* Info del horario */}
            <div className="bh-day-body">
              {hours.is_closed ? (
                <span className="bh-closed-label">Cerrado</span>
              ) : (
                <>
                  <div className="bh-time-row">
                    <Clock size={12} />
                    <span>{fmt(hours.start_time)}–{fmt(hours.end_time)}</span>
                  </div>
                  {hours.break_start && hours.break_end && (
                    <div className="bh-break-row">
                      <Coffee size={11} />
                      <span>{fmt(hours.break_start)}–{fmt(hours.break_end)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Botón editar */}
            <button
              className="bh-edit-btn"
              onClick={() => setEditingHours(hours)}
              title={`Editar ${DAYS_ES[hours.day_of_week]}`}
            >
              <Edit2 size={13} />
              <span>Editar</span>
            </button>
          </div>
        ))}
      </div>

      {/* Modal de edición */}
      {editingHours && (
        <div className="bh-modal-backdrop" onClick={() => setEditingHours(null)}>
          <div className="bh-modal" onClick={e => e.stopPropagation()}>
            <div className="bh-modal-header">
              <h3>
                <Clock size={18} />
                {DAYS_ES[editingHours.day_of_week]}
              </h3>
              <button className="bh-modal-close" onClick={() => setEditingHours(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bh-form">
              {/* Toggle cerrado */}
              <label className="bh-toggle-row">
                <input
                  type="checkbox"
                  name="is_closed"
                  checked={editingHours.is_closed}
                  onChange={handleInputChange}
                />
                <span className="bh-toggle-label">Día cerrado</span>
              </label>

              {!editingHours.is_closed && (
                <>
                  <div className="bh-form-row">
                    <div className="bh-form-group">
                      <label>Apertura</label>
                      <input
                        type="time"
                        name="start_time"
                        value={editingHours.start_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="bh-form-group">
                      <label>Cierre</label>
                      <input
                        type="time"
                        name="end_time"
                        value={editingHours.end_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="bh-break-section">
                    <span className="bh-break-title">
                      <Coffee size={14} /> Descanso (opcional)
                    </span>
                    <div className="bh-form-row">
                      <div className="bh-form-group">
                        <label>Inicio</label>
                        <input
                          type="time"
                          name="break_start"
                          value={editingHours.break_start || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="bh-form-group">
                        <label>Fin</label>
                        <input
                          type="time"
                          name="break_end"
                          value={editingHours.break_end || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="bh-save-btn" disabled={saving}>
                <Check size={16} />
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessHoursManagement;
