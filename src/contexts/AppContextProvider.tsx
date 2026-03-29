import React from 'react';
import { AppointmentProvider } from './AppointmentContext';
import { ServiceProvider } from './ServiceContext';
import { BusinessHoursProvider } from './BusinessHoursContext';
import { BookingRulesProvider } from './BookingRulesContext';
import { ReminderProvider } from './ReminderContext';
import { LoyaltyProvider } from './LoyaltyContext';
import { StatsProvider } from './StatsContext';

interface AppContextProviderProps {
  children: React.ReactNode;
}

/**
 * Componente que integra todos los proveedores de contexto de la aplicación
 * para proporcionar acceso global a los datos
 */
export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  return (
    <ServiceProvider>
      <BusinessHoursProvider>
        <AppointmentProvider>
          <BookingRulesProvider>
            <ReminderProvider>
              <LoyaltyProvider>
                <StatsProvider>
                  {children}
                </StatsProvider>
              </LoyaltyProvider>
            </ReminderProvider>
          </BookingRulesProvider>
        </AppointmentProvider>
      </BusinessHoursProvider>
    </ServiceProvider>
  );
};