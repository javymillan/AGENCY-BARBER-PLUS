import React, { useState } from 'react';
import { Sun, Moon, Store, Settings, LayoutDashboard } from 'lucide-react';
import { BusinessData } from '../../../types';
import AppointmentCalendar from '../Calendar/AppointmentCalendar';
import AppointmentForm from '../Appointments/AppointmentForm';
import AppointmentsList from '../Appointments/AppointmentsList';
import AppointmentDetails from '../Appointments/AppointmentDetails';
import ServiceManagement from '../Services/ServiceManagement';
import BusinessHoursManagement from '../BusinessHours/BusinessHoursManagement';
import BlockedTimesManagement from '../BusinessHours/BlockedTimesManagement';
import DashboardManager from '../Dashboard/DashboardManager';
import './MainLayout.css';

interface MainLayoutProps {
  businessData: BusinessData | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isAdminAuthenticated: boolean;
  handleAdminLogin: () => void;
  handleAdminLogout: () => void;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  businessData,
  isDarkMode,
  toggleDarkMode,
  isAdminAuthenticated,
  handleAdminLogin,
  handleAdminLogout,
  children
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  
  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <header className="app-header">
        <div className="logo-container">
          {businessData?.logo_url ? (
            <img src={businessData.logo_url} alt={businessData.name} className="business-logo" />
          ) : (
            <Store size={32} />
          )}
          <h1 className="business-name">{businessData?.name || 'Mi Negocio'}</h1>
        </div>
        
        <div className="header-actions">
          <div className="control-buttons">
            <button 
              className="dashboard-btn dashboard-btn-highlight"
              onClick={() => setShowDashboardModal(true)}
              aria-label="Panel de Control"
              title="Abrir Panel de Control"
              style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
            >
              <LayoutDashboard size={24} />
              <span className="btn-text">Panel de Control</span>
            </button>

            <button 
              className="theme-toggle-btn"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <div className="header-buttons">
            
            {isAdminAuthenticated ? (
              <div className="admin-actions">
                <button 
                  className="settings-btn"
                  onClick={() => setShowSettingsModal(true)}
                  aria-label="Configuración"
                >
                  <Settings size={20} />
                </button>
                <button 
                  className="btn btn-sm btn-outline-danger logout-btn"
                  onClick={handleAdminLogout}
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-sm btn-outline-primary login-btn"
                onClick={handleAdminLogin}
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="app-content">
        {children}
      </main>
      
      <footer className="app-footer">
        <div className="business-info">
          {businessData?.phone && (
            <p className="business-phone">Tel: {businessData.phone}</p>
          )}
          {businessData?.address && (
            <p className="business-address">{businessData.address}</p>
          )}
        </div>
        <p className="copyright">&copy; {new Date().getFullYear()} {businessData?.name || 'Mi Negocio'}</p>
      </footer>
      
      {showSettingsModal && (
        <div className="modal-backdrop">
          <div className="modal-content settings-modal">
            <div className="modal-header">
              <h3>Configuración</h3>
              <button 
                className="close-button"
                onClick={() => setShowSettingsModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="settings-tabs">
              <button className="settings-tab active">Información del Negocio</button>
              <button className="settings-tab">Horarios</button>
              <button className="settings-tab">Servicios</button>
              <button className="settings-tab">Empleados</button>
            </div>
            <div className="settings-content">
              {/* Aquí se mostraría el contenido de la pestaña seleccionada */}
            </div>
          </div>
        </div>
      )}
      
      {showDashboardModal && (
        <div className="modal-backdrop">
          <div className="modal-content dashboard-modal">
            <div className="modal-header">
              <h3>Panel de Control</h3>
              <button 
                className="close-button"
                onClick={() => setShowDashboardModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="dashboard-content">
              <DashboardManager isAdminAuthenticated={isAdminAuthenticated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
