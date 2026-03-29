import React, { useState, useEffect } from 'react';
import { Mail, User, Store, Phone, X } from 'lucide-react';
import { getBusinessData } from '../lib/business';
import type { BusinessData } from '../types';
import '../components/LogoEffect.css';
import toast from 'react-hot-toast';

interface WelcomeScreenProps {
  onLogin: (email: string, phone?: string) => void;
  onNewUser: () => void;
}

export function WelcomeScreen({ onLogin, onNewUser }: WelcomeScreenProps) {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  useEffect(() => {
    async function fetchBusinessData() {
      const data = await getBusinessData();
      setBusinessData(data);
      setLoading(false);
    }

    fetchBusinessData();
  }, []);

  const validateEmail = (email: string) => {
    if (!email.includes('@')) {
      setLoginError('El correo debe contener @');
      return false;
    }
    setLoginError('');
    return true;
  };

  const validatePhone = (phone: string) => {
    // Validación básica: al menos 10 dígitos
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone)) {
      setLoginError('El teléfono debe tener al menos 10 dígitos');
      return false;
    }
    setLoginError('');
    return true;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMethod === 'email') {
      if (!validateEmail(clientEmail)) {
        return;
      }
      onLogin(clientEmail);
    } else {
      if (!validatePhone(clientPhone)) {
        return;
      }
      onLogin('', clientPhone);
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === 'email' ? 'phone' : 'email');
    setLoginError('');
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4 theme-transition">
      <div className="text-center mb-12 animate-fadeIn">
        <div className="flex justify-center mb-8">
          {businessData?.logo_url ? (
            <img 
              src={businessData.logo_url} 
              alt={businessData.name}
              className="w-64 h-64 object-contain transition-all duration-300 logo-neon logo-neon-animated"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const storeIcon = document.createElement('div');
                  storeIcon.innerHTML = '<Store class="w-32 h-32 text-primary" />';
                  parent.appendChild(storeIcon.firstChild as Node);
                }
              }}
            />
          ) : loading ? (
            <div className="animate-pulse flex items-center justify-center w-64 h-64">
              <div className="rounded-full bg-primary/20 h-32 w-32"></div>
            </div>
          ) : (
            <Store className="w-32 h-32 text-primary" />
          )}
        </div>
        <h1 className="text-6xl font-bold mb-4 text-default">
          {loading ? 'Cargando...' : businessData?.name || 'Mi Negocio'}
        </h1>
        <p className="text-2xl text-secondary mb-12">Sistema Inteligente de Reservas</p>
      </div>

      <div className="w-full max-w-md space-y-6 animate-fadeIn">
        {showLoginForm ? (
          <div className="bg-accent rounded-xl shadow-xl p-6 relative">
            <button 
              onClick={() => setShowLoginForm(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-default transition-colors p-1 hover:bg-white/5 rounded-full"
              aria-label="Regresar"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-default text-center mb-6">Iniciar sesión</h2>
            
            <div className="flex justify-center mb-4">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${loginMethod === 'email' ? 'bg-primary text-white border-primary' : 'bg-secondary text-default border-default'}`}
                >
                  <Mail className="w-4 h-4 inline mr-1" />
                  Correo
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${loginMethod === 'phone' ? 'bg-primary text-white border-primary' : 'bg-secondary text-default border-default'}`}
                >
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </button>
              </div>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              {loginMethod === 'email' ? (
                <div>
                  <label htmlFor="login-email" className="block mb-2 text-text-secondary">
                    Correo electrónico:
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                    <input
                      id="login-email"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => {
                        setClientEmail(e.target.value);
                        if (e.target.value) validateEmail(e.target.value);
                      }}
                      className="w-full p-3 pl-10 border border-default rounded-lg bg-secondary text-default focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="tu@correo.com"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="login-phone" className="block mb-2 text-text-secondary">
                    Número de teléfono:
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                    <input
                      id="login-phone"
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => {
                        setClientPhone(e.target.value);
                        if (e.target.value) validatePhone(e.target.value);
                      }}
                      className="w-full p-3 pl-10 border border-default rounded-lg bg-secondary text-default focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="1234567890"
                      required
                    />
                  </div>
                </div>
              )}
              
              {loginError && <p className="mt-1 text-red-500 text-sm">{loginError}</p>}
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="px-4 py-2 border border-default rounded-lg text-text-secondary hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Aceptar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => setShowLoginForm(true)}
              className="w-full py-4 px-6 bg-accent text-default font-semibold rounded-xl border border-default hover:bg-accent/80 transition-all flex items-center justify-center gap-3"
            >
              <Mail className="w-5 h-5" />
              <span>Iniciar con correo o teléfono</span>
            </button>
            
            <button
              onClick={onNewUser}
              className="w-full py-4 px-6 bg-primary text-default font-semibold rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-3"
            >
              <User className="w-5 h-5" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}