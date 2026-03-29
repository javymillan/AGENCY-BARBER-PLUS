import React from 'react';
import BusinessStatsManager from './BusinessStatsManager';
import { StatsProvider } from '../../../contexts/StatsContext';

interface StatsManagerProps {
  isAdminAuthenticated: boolean; // Mantenemos el prop pero no lo usamos para restricciones
}

const StatsManager: React.FC<StatsManagerProps> = ({ isAdminAuthenticated }) => {
  return (
    <div className="stats-manager">
      {/* Estadísticas disponibles para TODOS los usuarios */}
      <BusinessStatsManager isAdminAuthenticated={isAdminAuthenticated} />
    </div>
  );
};

// Componente envuelto con el proveedor de contexto
const StatsManagerWithProvider: React.FC<StatsManagerProps> = (props) => (
  <StatsProvider>
    <StatsManager {...props} />
  </StatsProvider>
);

export default StatsManagerWithProvider;
