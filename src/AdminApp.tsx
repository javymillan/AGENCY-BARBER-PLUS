import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Sun, Moon, Store, LayoutDashboard, ArrowLeft } from 'lucide-react';
import './admin.css';

// Importar componentes
import AppointmentManager from './components/admin/Appointments/AppointmentManager';
import ServiceManagement from './components/admin/Services/ServiceManagement';
import BusinessHoursManagement from './components/admin/BusinessHours/BusinessHoursManagement';
import BlockedTimesManagement from './components/admin/BusinessHours/BlockedTimesManagement';
import DashboardManager from './components/admin/Dashboard/DashboardManager';
import BrandingManager from './components/admin/Branding/BrandingManager';
import { ErrorBoundary } from 'react-error-boundary';

// Importar contextos
import { AppContextProvider } from './contexts/AppContextProvider';

// Importar hooks
import { useServices } from './contexts/ServiceContext';
import { useBusinessHours } from './contexts/BusinessHoursContext';

// Importar autenticación
import { loginAdmin } from './lib/auth';
import { supabase } from './lib/supabase';
import { Service, BusinessHours, BlockedTime } from './types';

function AdminAppContent({ onExit }: { onExit: () => void }) {
  // Estado para el tema oscuro/claro
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Estado para la autenticación de administrador con localStorage
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('isAdminAuthenticated') === 'true';
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(() => {
    return localStorage.getItem('isAdminAuthenticated') !== 'true';
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Estado para mostrar el dashboard
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Estado para la navegación entre secciones
  const [activeSection, setActiveSection] = useState<'appointments' | 'services' | 'hours' | 'business'>('appointments');
  
  // Estado para datos del negocio
  const [businessData, setBusinessData] = useState({
    name: 'AGENCY BARBER PLUS',
    logo_url: '',
    address: '',
    phone: ''
  });

  // Hooks de contexto
  const { services, createService, updateService, deleteService } = useServices();
  const { businessHours, blockedTimes, updateBusinessHours, createBlockedTime, deleteBlockedTime } = useBusinessHours();
  
  // Efecto para aplicar el tema oscuro/claro
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Cargar datos del negocio al iniciar
  useEffect(() => {
    loadBusinessData();
  }, []);
  
  // Función para cargar datos del negocio
  const loadBusinessData = async () => {
    try {
      const { data, error } = await supabase
        .from('business_data')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error al cargar datos del negocio:', error);
        return;
      }

      if (data) {
        setBusinessData({
          name: data.name || 'AGENCY BARBER PLUS',
          logo_url: data.logo_url || '',
          address: data.address || '',
          phone: data.phone || ''
        });
      }
    } catch (err) {
      console.error('Error inesperado al cargar datos del negocio:', err);
    }
  };
  
  // Función para manejar el inicio de sesión del administrador
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await loginAdmin(adminUsername, adminPassword);
      if (success) {
        setIsAdminAuthenticated(true);
        setShowAdminLoginModal(false);
        localStorage.setItem('isAdminAuthenticated', 'true');
        setAdminUsername('');
        setAdminPassword('');
      } else {
        alert('Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error al iniciar sesión');
    }
  };
  
  // Función para cerrar sesión del administrador
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setShowAdminLoginModal(true);
    localStorage.removeItem('isAdminAuthenticated');
  };

  // Función para alternar el tema
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!isAdminAuthenticated && !showAdminLoginModal) {
    onExit();
    return null;
  }

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <header className="app-header">
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <button className="btn btn-sm btn-outline-primary" onClick={onExit} style={{ flexShrink: 0 }}>
             <ArrowLeft size={16} /> Volver
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {businessData.logo_url ? (
              <div className="relative group perspective-1000">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 transition-all duration-500" />
                <img 
                  src={businessData.logo_url} 
                  alt={businessData.name} 
                  className="business-logo relative z-10" 
                  style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}
                />
              </div>
            ) : (
              <Store size={32} className="business-icon" />
            )}
            <div className="business-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 className="business-name" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {businessData.name} <span style={{opacity: 0.6, fontSize: '0.8em', textTransform: 'uppercase'}}>- Admin</span>
              </h1>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="control-buttons">
            <button 
              className="dashboard-btn"
              onClick={() => setShowDashboard(true)}
              title="Abrir Panel de Control"
            >
              <LayoutDashboard size={20} />
              <span>Panel</span>
            </button>

            <button 
              className="theme-toggle-btn"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          <div className="auth-section">
            {isAdminAuthenticated && (
              <button 
                className="btn btn-sm btn-outline-danger"
                onClick={handleAdminLogout}
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      </header>
      
      {isAdminAuthenticated && (
        <nav className="app-nav">
          <button 
            className={`nav-button ${activeSection === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveSection('appointments')}
          >
            Citas
          </button>
          
          <button 
            className={`nav-button ${activeSection === 'services' ? 'active' : ''}`}
            onClick={() => setActiveSection('services')}
          >
            Servicios
          </button>
          
          <button 
            className={`nav-button ${activeSection === 'hours' ? 'active' : ''}`}
            onClick={() => setActiveSection('hours')}
          >
            Horarios
          </button>
          
          <button 
            className={`nav-button ${activeSection === 'business' ? 'active' : ''}`}
            onClick={() => setActiveSection('business')}
          >
            Perfil
          </button>
        </nav>
      )}
      
      <main className="app-content">
        {isAdminAuthenticated ? (
          <>
            {activeSection === 'appointments' && (
              <AppointmentManager isAdminAuthenticated={isAdminAuthenticated} />
            )}
            
            {activeSection === 'services' && (
              <ServiceManagement 
                services={services}
                onAddService={async (service: Omit<Service, 'id'>) => {
                  await createService(service as Omit<Service, 'id' | 'created_at'>);
                }}
                onUpdateService={async (service: Service) => {
                  await updateService(service.id, service);
                }}
                onDeleteService={async (serviceId: string) => {
                  await deleteService(serviceId);
                }}
                isAdminAuthenticated={isAdminAuthenticated}
              />
            )}
            
            {activeSection === 'hours' && (
              <div className="hours-management-container">
                <BusinessHoursManagement 
                  businessHours={businessHours}
                  onUpdateBusinessHours={async (hours: BusinessHours) => {
                    await updateBusinessHours(hours.id, hours);
                  }}
                  isAdminAuthenticated={isAdminAuthenticated}
                />
                <BlockedTimesManagement 
                  blockedTimes={blockedTimes}
                  onAddBlockedTime={async (blockedTime: Omit<BlockedTime, 'id'>) => {
                    await createBlockedTime(blockedTime);
                  }}
                  onDeleteBlockedTime={async (blockedTimeId: string) => {
                    await deleteBlockedTime(blockedTimeId);
                  }}
                  isAdminAuthenticated={isAdminAuthenticated}
                />
              </div>
            )}
            
            {activeSection === 'business' && (
              <BrandingManager onUpdate={loadBusinessData} />
            )}
          </>
        ) : (
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh'}}>
             <h2>Inicie sesión como Administrador</h2>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p className="copyright">&copy; {new Date().getFullYear()} AGENCY BARBER PLUS - PLATAFORMA INTEGRADA</p>
      </footer>
      
      {/* Modal de inicio de sesión de administrador */}
      {showAdminLoginModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Acceso de Administrador</h3>
              <button 
                className="close-button" 
                onClick={onExit}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAdminLogin} className="admin-login-form">
              <div className="form-group">
                <label htmlFor="admin-username">Usuario:</label>
                <input
                  type="text"
                  id="admin-username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="admin-password">Contraseña:</label>
                <input
                  type="password"
                  id="admin-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
                Iniciar Sesión
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal del Dashboard */}
      {showDashboard && (
        <div className="modal-overlay">
          <div className="modal-container dashboard-modal" style={{background: 'var(--card-bg)'}}>
            <div className="modal-header">
              <h3>Panel de Control</h3>
              <button 
                className="close-button"
                onClick={() => setShowDashboard(false)}
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
      
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export function AdminApp({ onExit }: { onExit: () => void }) {
  return (
    <AppContextProvider>
      <ErrorBoundary fallbackRender={({ error }: { error: any }) => (
        <div style={{ padding: 20, color: 'red', background: 'white', zIndex: 99999, position: 'relative' }}>
          <h2>Algo salió mal en el panel de administrador:</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{error?.message || String(error)}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{error?.stack}</pre>
          <button onClick={onExit} style={{ padding: '8px 16px', marginTop: 16 }}>Volver al inicio</button>
        </div>
      )}>
        <AdminAppContent onExit={onExit} />
      </ErrorBoundary>
    </AppContextProvider>
  );
}
