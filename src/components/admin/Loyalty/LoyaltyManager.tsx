import React, { useState } from 'react';
import LoyaltyPointsManager from './LoyaltyPointsManager';
import LoyaltyRewardsManager from './LoyaltyRewardsManager';
import { LoyaltyProvider } from '../../../contexts/LoyaltyContext';
import './LoyaltyManager.css';

interface LoyaltyManagerProps {
  isAdminAuthenticated: boolean; // Mantenemos el prop pero no lo usamos para restricciones
}

const LoyaltyManager: React.FC<LoyaltyManagerProps> = ({ isAdminAuthenticated }) => {
  const [activeTab, setActiveTab] = useState<'points' | 'rewards'>('points');

  // Sistema de fidelización disponible para TODOS los usuarios

  return (
    <div className="loyalty-manager">
      <h1>Sistema de Fidelización</h1>
      
      <div className="loyalty-tabs">
        <button 
          className={`tab ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveTab('points')}
        >
          Puntos de Clientes
        </button>
        <button 
          className={`tab ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          Recompensas
        </button>
      </div>

      <div className="loyalty-content">
        {activeTab === 'points' ? (
          <LoyaltyPointsManager isAdminAuthenticated={isAdminAuthenticated} />
        ) : (
          <LoyaltyRewardsManager isAdminAuthenticated={isAdminAuthenticated} />
        )}
      </div>
    </div>
  );
};

// Componente envuelto con el proveedor de contexto
const LoyaltyManagerWithProvider: React.FC<LoyaltyManagerProps> = (props) => (
  <LoyaltyProvider>
    <LoyaltyManager {...props} />
  </LoyaltyProvider>
);

export default LoyaltyManagerWithProvider;
