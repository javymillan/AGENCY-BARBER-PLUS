import React, { useMemo, useState } from 'react';
import { Appointment } from '../../../types';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X, Calendar, Clock, User, Scissors, CheckCircle2, AlertCircle,
  XCircle, Phone, DollarSign, Filter, TrendingUp,
} from 'lucide-react';
import './AppointmentsList.css';

interface AppointmentsListProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  onClose: () => void;
  date: Date;
  isAllView?: boolean;
}

/* ── Helpers ─────────────────────────────────────── */
const statusLabel = (s?: string) => {
  if (s === 'completed') return { label: 'Completada', color: '#10b981', Icon: CheckCircle2 };
  if (s === 'confirmed')  return { label: 'Confirmada',  color: '#3b82f6', Icon: AlertCircle };
  if (s === 'cancelled')  return { label: 'Cancelada',   color: '#ef4444', Icon: XCircle };
  return { label: 'Pendiente', color: '#f59e0b', Icon: AlertCircle };
};

const dayLabel = (dateStr: string) => {
  const d = parseISO(dateStr);
  if (isToday(d))    return 'HOY';
  if (isTomorrow(d)) return 'MAÑANA';
  return format(d, "EEEE d 'de' MMMM", { locale: es }).toUpperCase();
};

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed';

/* ── Component ────────────────────────────────────── */
const AppointmentsList: React.FC<AppointmentsListProps> = ({
  appointments,
  onSelectAppointment,
  onClose,
  date,
  isAllView = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  /* Filter appointments based on status tab */
  const filteredAppointments = useMemo(() => {
    if (!isAllView || activeFilter === 'all') return appointments;
    if (activeFilter === 'pending') return appointments.filter(a => !a.status || a.status === 'pending');
    if (activeFilter === 'confirmed') return appointments.filter(a => a.status === 'confirmed');
    if (activeFilter === 'completed') return appointments.filter(a => a.status === 'completed');
    return appointments;
  }, [appointments, isAllView, activeFilter]);

  /* Revenue summary */
  const revenueSummary = useMemo(() => {
    if (!isAllView) return null;
    const total = appointments.reduce((sum, a) => sum + (a.services?.price ?? 0), 0);
    const pending = appointments
      .filter(a => !a.status || a.status === 'pending' || a.status === 'confirmed')
      .reduce((sum, a) => sum + (a.services?.price ?? 0), 0);
    return { total, pending };
  }, [appointments, isAllView]);

  /* Count per status for filter tabs */
  const counts = useMemo(() => ({
    all:       appointments.length,
    pending:   appointments.filter(a => !a.status || a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  }), [appointments]);

  /* Group by day for all-view */
  const groupedByDay = useMemo(() => {
    if (!isAllView) return null;
    const map = new Map<string, Appointment[]>();
    for (const app of filteredAppointments) {
      const key = app.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(app);
    }
    return map;
  }, [filteredAppointments, isAllView]);

  /* Single day: sort by time */
  const singleDaySorted = useMemo(() => {
    if (isAllView) return [];
    return [...appointments].sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, isAllView]);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',       label: 'Todas' },
    { key: 'pending',   label: 'Pendientes' },
    { key: 'confirmed', label: 'Confirmadas' },
    { key: 'completed', label: 'Completadas' },
  ];

  return (
    <div className="al-backdrop" onClick={onClose}>
      <div
        className={`al-modal ${isAllView ? 'al-modal--wide' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="al-header">
          <div className="al-header-left">
            <Calendar size={20} />
            <div>
              <h3 className="al-title">
                {isAllView
                  ? 'Próximas Citas'
                  : `Citas — ${format(date, "EEEE d 'de' MMMM", { locale: es })}`}
              </h3>
              {isAllView && (
                <p className="al-subtitle">
                  {appointments.length} cita{appointments.length !== 1 ? 's' : ''} desde hoy
                </p>
              )}
            </div>
          </div>
          <button className="al-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ── Revenue Banner (all-view only) ── */}
        {isAllView && revenueSummary && (
          <div className="al-revenue-bar">
            <div className="al-revenue-item">
              <TrendingUp size={14} />
              <span className="al-revenue-label">Ingresos esperados</span>
              <span className="al-revenue-value">${revenueSummary.pending.toLocaleString()}</span>
            </div>
            <div className="al-revenue-divider" />
            <div className="al-revenue-item al-revenue-item--muted">
              <DollarSign size={14} />
              <span className="al-revenue-label">Total periodo</span>
              <span className="al-revenue-value">${revenueSummary.total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* ── Filter Tabs (all-view only) ── */}
        {isAllView && (
          <div className="al-filters">
            <Filter size={13} className="al-filters-icon" />
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`al-filter-btn ${activeFilter === f.key ? 'al-filter-btn--active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
                <span className="al-filter-count">{counts[f.key]}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Body ── */}
        <div className="al-body">
          {filteredAppointments.length === 0 ? (
            <div className="al-empty">
              <Calendar size={48} strokeWidth={1} />
              <p>{isAllView ? 'No hay citas para este filtro.' : 'No hay citas para este día.'}</p>
            </div>
          ) : isAllView ? (
            /* ── VISTA PANORAMA: agrupada por día ── */
            <div className="al-groups">
              {[...(groupedByDay ?? new Map()).entries()].map(([dateStr, dayApps]) => (
                <div key={dateStr} className="al-day-group">
                  {/* Header del día */}
                  <div className={`al-day-label ${isToday(parseISO(dateStr)) ? 'al-day-today' : ''}`}>
                    <span className="al-day-text">{dayLabel(dateStr)}</span>
                    <div className="al-day-meta">
                      <span className="al-day-count">{dayApps.length} cita{dayApps.length !== 1 ? 's' : ''}</span>
                      {dayApps.some(a => a.services?.price) && (
                        <span className="al-day-revenue">
                          ${dayApps.reduce((s, a) => s + (a.services?.price ?? 0), 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Citas del día */}
                  <div className="al-day-cards">
                    {dayApps
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(app => {
                        const { label, color, Icon } = statusLabel(app.status);
                        return (
                          <div
                            key={app.id}
                            className="al-card"
                            onClick={() => onSelectAppointment(app)}
                          >
                            <div className="al-card-time">
                              <Clock size={13} />
                              {app.time?.slice(0, 5)}
                            </div>
                            <div className="al-card-info">
                              <span className="al-card-name">
                                <User size={13} /> {app.client_name}
                              </span>
                              <span className="al-card-service">
                                <Scissors size={12} /> {app.services?.name || 'Servicio'}
                                {app.services?.price && <em> · ${app.services.price}</em>}
                              </span>
                              {app.client_phone && (
                                <span className="al-card-phone">
                                  <Phone size={11} /> {app.client_phone}
                                </span>
                              )}
                            </div>
                            <span
                              className="al-card-status"
                              style={{ '--status-color': color } as React.CSSProperties}
                            >
                              <Icon size={12} /> {label}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── VISTA DÍA: lista simple ── */
            <div className="al-single-list">
              {singleDaySorted.map(app => {
                const { label, color, Icon } = statusLabel(app.status);
                return (
                  <div
                    key={app.id}
                    className="al-card al-card--full"
                    onClick={() => onSelectAppointment(app)}
                  >
                    <div className="al-card-time">
                      <Clock size={14} />
                      {app.time?.slice(0, 5)}
                    </div>
                    <div className="al-card-info">
                      <span className="al-card-name">
                        <User size={14} /> {app.client_name}
                      </span>
                      <span className="al-card-service">
                        <Scissors size={13} /> {app.services?.name || 'Servicio'}
                        {app.services?.price && <em> · ${app.services.price}</em>}
                      </span>
                      {app.client_phone && (
                        <span className="al-card-phone">
                          <Phone size={12} /> {app.client_phone}
                        </span>
                      )}
                    </div>
                    <span
                      className="al-card-status"
                      style={{ '--status-color': color } as React.CSSProperties}
                    >
                      <Icon size={13} /> {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsList;
