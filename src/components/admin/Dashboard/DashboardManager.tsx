import React, { useState } from 'react';
import ReminderManager from '../Reminders/ReminderManager';
import LoyaltyManager from '../Loyalty/LoyaltyManager';
import StatsManager from '../Stats/StatsManager';
import BrandingManager from '../Branding/BrandingManager';
import { Bell, Award, BarChart2, Layout } from 'lucide-react';
import './DashboardManager.css';

interface DashboardManagerProps {
  isAdminAuthenticated: boolean;
}

const DashboardManager: React.FC<DashboardManagerProps> = ({ isAdminAuthenticated }) => {
  const [activeTab, setActiveTab] = useState<'reminders' | 'loyalty' | 'stats' | 'branding'>('branding');

  return (
    <div className="dashboard-manager">
      <h1>Panel de Control</h1>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          <Bell size={18} />
          Recordatorios
        </button>
        <button 
          className={`tab ${activeTab === 'loyalty' ? 'active' : ''}`}
          onClick={() => setActiveTab('loyalty')}
        >
          <Award size={18} />
          Fidelización
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart2 size={18} />
          Estadísticas
        </button>
        <button 
          className={`tab ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          <Layout size={18} />
          Perfil
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'reminders' && (
          <ReminderManager isAdminAuthenticated={isAdminAuthenticated} />
        )}
        
        {activeTab === 'loyalty' && (
          <LoyaltyManager isAdminAuthenticated={isAdminAuthenticated} />
        )}
        
        {activeTab === 'stats' && (
          <StatsManager isAdminAuthenticated={isAdminAuthenticated} />
        )}
        
        {activeTab === 'branding' && (
          <BrandingManager />
        )}
      </div>
    </div>
  );
};

export default DashboardManager;
