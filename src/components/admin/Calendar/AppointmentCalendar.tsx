import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { Appointment } from '../../../types';

interface AppointmentCalendarProps {
  date: Date;
  setDate: (date: Date) => void;
  datesWithAppointments: string[];
  handleDateClick: (date: Date) => void;
  isDarkMode: boolean;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  date,
  setDate,
  datesWithAppointments,
  handleDateClick,
  isDarkMode
}) => {
  // Función para personalizar el contenido de los días en el calendario
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const hasAppointments = datesWithAppointments.includes(dateStr);
    
    return hasAppointments ? (
      <div className="appointment-indicator"></div>
    ) : null;
  };

  return (
    <div className="calendar-container">
      <Calendar
        onChange={setDate}
        value={date}
        onClickDay={handleDateClick}
        tileContent={tileContent}
        className={isDarkMode ? 'dark-calendar' : ''}
        locale="es-ES"
      />
    </div>
  );
};

export default AppointmentCalendar;
