import React, { useState, useEffect } from 'react';
import { Mail, Store, Phone, X, User } from 'lucide-react';
import { getBusinessData } from '../lib/business';
import type { BusinessData } from '../types';
import '../components/LogoEffect.css';

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


  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center p-4 theme-transition relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 rounded-full blur-[120px] opacity-40" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px] opacity-30" />
      <div className="text-center mb-12 animate-fadeIn">
        <div className="flex justify-center mb-8">
          {businessData?.logo_url ? (
            <img 
              src={businessData.logo_url} 
              alt={businessData.name}
              className="w-80 h-80 object-contain transition-all duration-300 logo-neon logo-neon-animated"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const storeIcon = document.createElement('div');
                  storeIcon.innerHTML = '<Store class="w-40 h-40 text-primary" />';
                  parent.appendChild(storeIcon.firstChild as Node);
                }
              }}
            />
          ) : loading ? (
            <div className="animate-pulse flex items-center justify-center w-80 h-80">
              <div className="rounded-full bg-primary/20 h-40 w-40"></div>
            </div>
          ) : (
            <Store className="w-40 h-40 text-primary" />
          )}
        </div>
        <h1 className="text-6xl font-black mb-4 text-white tracking-tighter uppercase italic">
          {loading ? 'Cargando...' : businessData?.name || 'Mi Negocio'}
        </h1>
        <p className="text-xl text-white/40 tracking-[0.3em] uppercase font-light">Sistema Premium de Reservas</p>
      </div>

      <div className="w-full max-w-md space-y-6 animate-fadeIn">
        {showLoginForm ? (
          <div className="bg-brand-card border border-brand/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 relative overflow-hidden animate-slideUp">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-transparent" />
            
            <button 
              onClick={() => setShowLoginForm(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full z-10"
              aria-label="Regresar"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-white text-center mb-8">Iniciar Sesión</h2>
            
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/10" role="group">
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${loginMethod === 'email' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  CORREO
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${loginMethod === 'phone' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white/60'}`}
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  TELÉFONO
                </button>
              </div>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              {loginMethod === 'email' ? (
                <div>
                  <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3 ml-1">
                    Correo electrónico
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input
                      id="login-email"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => {
                        setClientEmail(e.target.value);
                        if (e.target.value) validateEmail(e.target.value);
                      }}
                      className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-white/20"
                      placeholder="tu@correo.com"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="login-phone" className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3 ml-1">
                    Número de teléfono
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input
                      id="login-phone"
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => {
                        setClientPhone(e.target.value);
                        if (e.target.value) validatePhone(e.target.value);
                      }}
                      className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-white/20"
                      placeholder="1234567890"
                      required
                    />
                  </div>
                </div>
              )}
              
              {loginError && <p className="mt-1 text-red-500 text-sm">{loginError}</p>}
              
              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all uppercase tracking-widest active:scale-95"
                >
                  INGRESAR
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="w-full py-3 text-white/40 hover:text-white/60 transition-colors font-bold text-xs uppercase tracking-widest"
                >
                  VOLVER
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <button
              onClick={() => setShowLoginForm(true)}
              className="w-full py-5 px-8 bg-brand-card border border-brand/30 text-white font-black rounded-2xl hover:bg-brand-card/80 hover:border-brand/60 transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 group"
            >
              <div className="p-2 bg-brand/10 rounded-lg group-hover:bg-brand/20 transition-colors">
                <Mail className="w-5 h-5 text-brand" />
              </div>
              <span className="uppercase tracking-widest">Ya tengo cuenta</span>
            </button>
            
            <button
              onClick={onNewUser}
              className="w-full py-5 px-8 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover transition-all flex items-center justify-center gap-4 shadow-xl shadow-primary/20 active:scale-95 group"
            >
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="uppercase tracking-widest text-brand-text">Agendar Nueva Cita</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}