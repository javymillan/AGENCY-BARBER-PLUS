import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Store, Calendar, Phone, User, Mail, ArrowLeft, Plus, Minus, History, CheckCircle, Instagram, Facebook, Settings, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { ThemeButton } from './components/ThemeButton';
import { LocationButton } from './components/LocationButton';
import { AppointmentHistory } from './components/AppointmentHistory';
import { RatingSystem } from './components/RatingSystem';
import { Testimonials } from './components/Testimonials';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TimeSlotSelector } from './components/TimeSlotSelector';
import { AppointmentLockManager } from './components/AppointmentLockManager';
import { sendClientWhatsAppNotification, sendBusinessWhatsAppNotification } from './lib/whatsapp';
import { getBusinessData } from './lib/business';
import { realTimeSyncManager } from './lib/realTimeSync';
import { finalValidateAndInsert } from './lib/appointmentValidation';
import type { Service, BusinessData, Appointment, ServicePromotion } from './types';
import { PromotionsSection } from './components/PromotionsSection';
import { GallerySection } from './components/GallerySection';
import './components/LogoEffect.css';

const AdminApp = lazy(() => import('./AdminApp').then(m => ({ default: m.AdminApp })));

// Helper to generate Google Calendar link
function generateGoogleCalendarLink(appointment: any, business: any) {
  const { service, date, time } = appointment;
  const startTime = new Date(`${date}T${time}`);
  const endTime = new Date(startTime.getTime() + (service.duration || 30) * 60000);

  const formatISO = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');

  const startStr = formatISO(startTime);
  const endStr = formatISO(endTime);

  const title = encodeURIComponent(`Cita: ${service.name} - ${business.name}`);
  const details = encodeURIComponent(`Servicio: ${service.name}\nBarbería: ${business.name}\nDirección: ${business.address}`);
  const location = encodeURIComponent(business.address);

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

function App() {
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showAllServices, setShowAllServices] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [promotions, setPromotions] = useState<ServicePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loginData, setLoginData] = useState<{ email: string; isLoggedIn: boolean } | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [selectedLocation] = useState<string | null>(null);
  const [isTimeSlotLocked, setIsTimeSlotLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string>('');
  const [lastAppointment, setLastAppointment] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [notificationSent, setNotificationSent] = useState<boolean | null>(null);
  const [isAdminView, setIsAdminView] = useState(() => {
    return localStorage.getItem('isAdminAuthenticated') === 'true';
  });

  useEffect(() => {
    async function fetchBusinessData() {
      const data = await getBusinessData();
      setBusinessData(data);
    }

    fetchBusinessData();

    // Verificar si hay un email guardado en localStorage
    const savedEmail = localStorage.getItem('clientEmail');
    if (savedEmail) {
      setClientEmail(savedEmail);
      setLoginData({ email: savedEmail, isLoggedIn: true });
      setShowWelcomeScreen(false);
    }

    // Inicializar sincronización en tiempo real
    return () => {
      realTimeSyncManager.unsubscribeAll();
    };
  }, []);

  // Apply brand colors
  useEffect(() => {
    if (businessData?.primary_color) {
      document.documentElement.style.setProperty('--primary', businessData.primary_color);
      // Generate a hover state (slightly darker or lighter)
      document.documentElement.style.setProperty('--primary-hover', businessData.primary_color + 'cc'); 
      
      // Convert hex to rgb for transitions and overlays
      const hex = businessData.primary_color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
      }
    }
    if (businessData?.accent_color) {
      document.documentElement.style.setProperty('--accent', businessData.accent_color);
    }
  }, [businessData]);

  useEffect(() => {
    async function fetchServices() {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('active', true)
          .order('name');

        if (error) throw error;

        setServices((data || []).map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          price: s.price,
          duration: s.duration
        })));
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('Error al cargar los servicios');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const { data, error } = await supabase
          .from('service_promotions')
          .select('*')
          .eq('active', true);

        if (error) throw error;

        const validPromotions = (data || []).filter(p => {
          if (!p.end_date) return true;
          return new Date(p.end_date) >= new Date(new Date().setHours(0, 0, 0, 0));
        }).map(p => ({
          ...p,
          discount_type: p.discount_type as 'percentage' | 'fixed_amount',
          days_of_week: Array.isArray(p.days_of_week) ? (p.days_of_week as number[]) : undefined
        }));

        setPromotions(validPromotions);
      } catch (error) {
        console.error('Error fetching promotions:', error);
      }
    }
    fetchPromotions();
  }, []);

  const validateEmail = (email: string) => {
    if (!email.includes('@')) {
      setEmailError('El correo debe contener @');
      return false;
    }
    setEmailError('');
    return true;
  };

  const formatPhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('52')) {
      cleaned = cleaned.substring(2);
    }

    if (cleaned.length !== 10) {
      setPhoneError('El número debe tener 10 dígitos');
      return phone;
    }

    setPhoneError('');
    return '+52' + cleaned;
  };

  const handleLockStatusChange = (isLocked: boolean, lockedByUser?: string) => {
    setIsTimeSlotLocked(isLocked);
    setLockedBy(lockedByUser || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone || !clientEmail) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    if (!validateEmail(clientEmail)) {
      return;
    }

    if (phoneError) {
      toast.error('Por favor corrija el número de teléfono');
      return;
    }

    if (isTimeSlotLocked) {
      toast.error('El horario seleccionado no está disponible');
      return;
    }

    const service = services.find(s => s.id === selectedService);

    if (!service) {
      toast.error('Servicio no válido');
      return;
    }

    setSubmitting(true);

    try {
      // SOLUCIÓN: Usar validación e inserción atómica
      const result = await finalValidateAndInsert(
        {
          service_id: service.id,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          date: selectedDate,
          time: selectedTime,
          notes: notes,
          location_id: selectedLocation || undefined
        },
        service.duration
      );

      if (!result.success) {
        toast.error(result.error || 'El horario seleccionado ya no está disponible');
        setSelectedTime(''); // Limpiar selección
        setStep(2); // Regresar a la selección de horario
        setSubmitting(false);
        return;
      }

      // Guardar el email en localStorage para futuras visitas
      localStorage.setItem('clientEmail', clientEmail);
      setLoginData({ email: clientEmail, isLoggedIn: true });

      const finalPrice = getDiscountedPrice(service, activePromotion || undefined);
      const appointmentData = {
        service,
        date: selectedDate,
        time: selectedTime,
        client: {
          name: clientName,
          phone: clientPhone,
          email: clientEmail
        },
        notes,
        promotion: activePromotion ? {
          name: activePromotion.name,
          discount: activePromotion.discount_type === 'percentage'
            ? `${activePromotion.discount_value}%`
            : `$${activePromotion.discount_value}`,
          finalPrice
        } : undefined
      };

      const [clientNotificationSent, businessNotificationSent] = await Promise.all([
        sendClientWhatsAppNotification(appointmentData),
        sendBusinessWhatsAppNotification(appointmentData)
      ]);

      setNotificationSent(clientNotificationSent && businessNotificationSent);

      let successMessage = '¡Cita agendada con éxito!';
      if (clientNotificationSent && businessNotificationSent) {
        successMessage += ' Se han abierto ventanas de WhatsApp para enviar notificaciones.';
      }

      toast.success(successMessage);

      // Mostrar modal de valoración después de un tiempo
      if (result.data) {
        const appId = result.data.id;
        setAppointmentId(appId);

        // NUEVO: Programar recordatorio y agregar puntos de lealtad
        const scheduleTasks = async () => {
          try {
            // 1. Programar Recordatorio (24h antes)
            const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`);
            const scheduledTime = new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000));
            
            await supabase.from('reminders').insert({
              appointment_id: appId,
              reminder_type: 'whatsapp',
              scheduled_time: scheduledTime.toISOString(),
              message: `Hola ${clientName}, recordatorio de tu cita para ${service.name} mañana a las ${selectedTime}.`,
              sent: false
            });

            // 2. Agregar Puntos de Lealtad (10 puntos por servicio)
            const { data: loyaltyData } = await supabase
              .from('loyalty_points')
              .select('*')
              .eq('client_phone', clientPhone)
              .single();

            if (loyaltyData) {
              await supabase
                .from('loyalty_points')
                .update({
                  points: loyaltyData.points + 10,
                  total_earned: loyaltyData.total_earned + 10,
                  last_appointment_id: appId,
                  updated_at: new Date().toISOString()
                })
                .eq('client_phone', clientPhone);
            } else {
              await supabase
                .from('loyalty_points')
                .insert({
                  client_phone: clientPhone,
                  client_name: clientName,
                  points: 10,
                  total_earned: 10,
                  last_appointment_id: appId
                });
            }

            // 3. Marcar cita como procesada para lealtad
            await supabase
              .from('appointments')
              .update({ loyalty_points_added: true })
              .eq('id', appId);

          } catch (error) {
            console.error('Error in post-booking tasks:', error);
          }
        };

        scheduleTasks();

        setTimeout(() => {
          setShowRatingModal(true);
        }, 2000);
      }

      if (result.data) {
        setAppointmentId(result.data.id);
        setTimeout(() => {
          setShowRatingModal(true);
        }, 2000);
      }

      setLastAppointment(appointmentData);
      setStep(4);
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime('');
      setClientName('');
      setClientPhone('');
      setNotes('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Hubo un error al agendar tu cita. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedServiceDetails = services.find(s => s.id === selectedService);
  const activePromotion = selectedServiceDetails
    ? promotions.find(p => {
      // If a specific promotion was selected, only use that one
      if (selectedPromotionId) {
        return p.id === selectedPromotionId;
      }
      // Otherwise checks if there is a promotion active for the selected date
      if (!p.active || p.service_id !== selectedServiceDetails.id) return false;

      if (selectedDate) {
        const dateObj = new Date(selectedDate + 'T00:00:00');
        const dayOfWeek = dateObj.getDay();

        if (p.days_of_week && p.days_of_week.length > 0) {
          return p.days_of_week.includes(dayOfWeek);
        }
      }
      // If no date selected yet, maybe just show it active if it exists? 
      // But for price calculation we want it to be accurate. 
      // Let's default to returning the promotion if no date is selected 
      // so the user sees "potential" discount, OR enforce date selection?
      // Current requirement: "select any other date... cost will be normal".
      // SO if date IS selected and doesn't match, this find should fail.
      return true;
    })
    : null;

  const getDiscountedPrice = (service: Service, promo?: ServicePromotion) => {
    if (!promo) return service.price;
    if (promo.discount_type === 'percentage') {
      return service.price * (1 - promo.discount_value / 100);
    }
    return Math.max(0, service.price - promo.discount_value);
  };

  const formattedDate = selectedDate ? format(new Date(selectedDate + 'T00:00:00'), "dd/MM/yyyy EEEE", { locale: es }) : '';
  const visibleServices = showAllServices ? services : services.slice(0, 4);
  const hasMoreServices = services.length > 4;

  const renderSummary = () => (
    <div className="bg-accent/50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-3">Resumen de la Cita</h3>
      <div className="space-y-2">
        <div>
          <span className="text-secondary">Servicio:</span>
          <p className="font-medium text-default">{selectedServiceDetails?.name}</p>
        </div>
        <div>
          <span className="text-secondary">Fecha:</span>
          <p className="font-medium text-default">{formattedDate}</p>
        </div>
        <div>
          <span className="text-secondary">Hora:</span>
          <p className="font-medium text-default">{selectedTime}</p>
        </div>
        <div>
          <span className="text-secondary">Precio:</span>
          <div className="flex items-center gap-2">
            {activePromotion ? (
              <>
                <span className="text-sm line-through text-secondary">${selectedServiceDetails?.price}</span>
                <span className="font-bold text-green-500">${getDiscountedPrice(selectedServiceDetails!, activePromotion)}</span>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                  {activePromotion.name}
                </span>
              </>
            ) : (
              <p className="font-medium text-primary">${selectedServiceDetails?.price}</p>
            )}
          </div>
        </div>
        <div>
          <span className="text-secondary">Duración:</span>
          <p className="font-medium text-default">{selectedServiceDetails?.duration} minutos</p>
        </div>
        <div className="pt-2 border-t border-default">
          <span className="text-secondary">Datos de Contacto:</span>
          <p className="font-medium text-default">{clientName}</p>
          <p className="text-sm text-secondary">{clientPhone}</p>
          <p className="text-sm text-secondary">{clientEmail}</p>
          {notes && (
            <div className="mt-2">
              <span className="text-secondary">Notas:</span>
              <p className="text-sm text-default">{notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Función para manejar el inicio de sesión desde la pantalla de bienvenida
  const handleWelcomeLogin = (email: string, phone?: string) => {
    if (email) {
      localStorage.setItem('clientEmail', email);
      setLoginData({ email, isLoggedIn: true });
      setClientEmail(email);
    } else if (phone) {
      // Si se inicia sesión con teléfono, guardamos el teléfono y creamos un email temporal
      // para mantener la compatibilidad con el resto del sistema
      localStorage.setItem('clientPhone', phone);
      const tempEmail = `phone_${phone}@temp.com`;
      localStorage.setItem('clientEmail', tempEmail);
      setLoginData({ email: tempEmail, isLoggedIn: true });
      setClientEmail(tempEmail);
      setClientPhone(phone);
    }

    setShowWelcomeScreen(false);
    toast.success('Inicio de sesión exitoso');
  };

  // Función para manejar el inicio de sesión desde el modal
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(clientEmail)) {
      return;
    }

    localStorage.setItem('clientEmail', clientEmail);
    setLoginData({ email: clientEmail, isLoggedIn: true });
    setShowLoginForm(false);
    toast.success('Inicio de sesión exitoso');
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('clientEmail');
    setLoginData(null);
    setClientEmail('');
    toast.success('Sesión cerrada');
  };

  // Función para repetir una cita anterior
  const handleRepeatAppointment = (appointment: Appointment, service: Service) => {
    setSelectedService(service.id);
    setClientName(appointment.client_name);
    setClientPhone(appointment.client_phone);
    setClientEmail(appointment.client_email);
    setStep(2);
    setShowHistoryModal(false);
  };

  return (
    <div className="min-h-screen bg-secondary text-default theme-transition">
      {isAdminView ? (
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-primary font-medium tracking-widest uppercase animate-pulse">Cargando Panel...</p>
            </div>
          </div>
        }>
          <AdminApp onExit={() => setIsAdminView(false)} />
        </Suspense>
      ) : (
        <>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--accent)',
                color: 'var(--text)',
                borderColor: 'var(--border)',
              },
            }}
          />

          {showWelcomeScreen ? (
            <WelcomeScreen
              onLogin={handleWelcomeLogin}
              onNewUser={() => setShowWelcomeScreen(false)}
            />
          ) : (
            <>
              {/* Premium Sticky Navbar */}
              <nav className="fixed top-0 left-0 right-0 z-[60] py-4 transition-all duration-500 bg-black/60 backdrop-blur-3xl border-b border-white/5">
                <div className="container mx-auto px-6 flex items-center justify-between">
                  <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setStep(1)}>
                    {businessData?.logo_url ? (
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 group-hover:bg-primary/40 transition-all duration-500" />
                        <img 
                          src={businessData.logo_url} 
                          alt="Logo" 
                          className="w-12 h-12 object-contain relative z-10 drop-shadow-2xl transition-transform group-hover:scale-110"
                        />
                      </div>
                    ) : (
                      <Store className="w-8 h-8 text-primary" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-lg font-black tracking-tighter text-white leading-tight">
                        {businessData?.name || 'BARBER PLUS'}
                      </span>
                      <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                        Premium Experience
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {loginData?.isLoggedIn && (
                      <>
                        <button
                          onClick={() => setShowHistoryModal(true)}
                          aria-label="Ver historial"
                          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary hover:text-white transition-all duration-300 font-bold text-xs"
                        >
                          <History className="w-4 h-4" />
                          <span className="hidden sm:inline">HISTORIAL</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 text-secondary/60 hover:text-white transition-colors text-xs font-bold"
                        >
                          SALIR
                        </button>
                      </>
                    )}
                    {!loginData?.isLoggedIn && (
                      <button
                        onClick={() => setShowLoginForm(true)}
                        className="px-6 py-2.5 bg-primary text-white font-bold rounded-full text-xs shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                      >
                        ACCEDER
                      </button>
                    )}
                  </div>
                </div>
              </nav>

              <div className="container mx-auto px-4 pt-32 pb-12">
                <header className="text-center mb-16 px-4">
                  <div className="flex justify-center mb-10">
                    {businessData?.logo_url ? (
                      <div className="relative group">
                        <img
                          src={businessData.logo_url}
                          alt={businessData.name}
                          className="w-56 h-56 object-contain transition-all duration-500 logo-neon logo-neon-animated group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const iconDiv = document.createElement('div');
                              iconDiv.className = "p-8 bg-accent rounded-full";
                              iconDiv.innerHTML = '<Store class="w-24 h-24 text-primary" />';
                              parent.appendChild(iconDiv);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-8 bg-accent rounded-full">
                        <Store className="w-24 h-24 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-8 flex flex-col items-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 tracking-tight">
                      {businessData?.name || 'Cargando...'}
                    </h1>
                    
                    {businessData?.description && (
                      <p className="max-w-2xl text-xl text-secondary mb-10 leading-relaxed font-light">
                        {businessData.description}
                      </p>
                    )}

                    <div className="flex flex-wrap justify-center gap-8 text-lg text-secondary mb-12">
                      <div className="flex items-center gap-3 hover:text-primary transition-all duration-300">
                        <Store className="w-6 h-6 text-primary" />
                        <span className="border-b border-transparent hover:border-primary">{businessData?.address}</span>
                      </div>
                      <div className="flex items-center gap-3 hover:text-primary transition-all duration-300">
                        <Phone className="w-6 h-6 text-primary" />
                        <span className="border-b border-transparent hover:border-primary">{businessData?.phone}</span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-8 mb-14">
                      {businessData?.instagram_url && (
                        <a 
                          href={businessData.instagram_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-5 bg-accent/50 backdrop-blur-xl border border-white/5 rounded-2xl hover:bg-primary hover:text-white transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-primary/40 group relative overflow-hidden"
                          aria-label="Instagram"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Instagram className="w-8 h-8 transition-transform group-hover:scale-110 relative z-10" />
                        </a>
                      )}
                      {businessData?.facebook_url && (
                        <a 
                          href={businessData.facebook_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-5 bg-accent/50 backdrop-blur-xl border border-white/5 rounded-2xl hover:bg-primary hover:text-white transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-primary/40 group relative overflow-hidden"
                          aria-label="Facebook"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Facebook className="w-8 h-8 transition-transform group-hover:scale-110 relative z-10" />
                        </a>
                      )}
                      <div className="hover:-translate-y-2 transition-transform duration-500">
                        <LocationButton />
                      </div>
                    </div>

                    <div className="mt-4 text-xs font-medium text-secondary/40 tracking-widest uppercase flex items-center gap-2">
                      <div className="h-[1px] w-8 bg-current opacity-20"></div>
                       PLATAFORMA AGENCY BARBER PLUS
                      <div className="h-[1px] w-8 bg-current opacity-20"></div>
                    </div>

                    {step === 1 && (
                      <div className="mt-2 flex flex-col sm:flex-row gap-4">
                        {loginData?.isLoggedIn ? (
                          <button
                            onClick={() => setShowHistoryModal(true)}
                            className="flex items-center justify-center gap-3 px-10 py-5 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all duration-300 shadow-2xl hover:shadow-primary/50 hover:scale-105 active:scale-95"
                          >
                            <History className="w-5 h-5" />
                            <span>MI PERFIL & HISTORIAL</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowLoginForm(true)}
                            className="flex items-center justify-center gap-3 px-10 py-5 border-2 border-primary text-primary font-bold rounded-2xl hover:bg-primary hover:text-white transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
                          >
                            <Mail className="w-5 h-5" />
                            <span>ACCEDER / REGISTRARSE</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </header>

                {/* Work Gallery */}
                {step === 1 && businessData?.gallery && businessData.gallery.length > 0 && (
                  <div className="mb-24 px-4">
                    <GallerySection images={businessData.gallery} />
                  </div>
                )}

                {/* Mostrar testimonios destacados en la página principal */}
                {step === 1 && <Testimonials />}

                {step !== 4 && (
                  <div className="max-w-2xl mx-auto bg-accent rounded-xl shadow-xl p-6 transition-all duration-300 animate-fadeIn">
                    <div className="flex justify-between mb-8">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex items-center ${step >= i ? 'text-primary' : 'text-secondary'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                      ${step >= i ? 'border-primary' : 'border-secondary'}`}>
                            {i}
                          </div>
                          {i < 3 && <div className={`h-0.5 w-16 mx-2 ${step > i ? 'bg-primary' : 'bg-secondary'}`} />}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                      {step === 1 && (
                        <div className="space-y-4">
                          <PromotionsSection
                            promotions={promotions}
                            services={services}
                            onSelectPromotion={(serviceId, promotionId) => {
                              setSelectedService(serviceId);
                              setSelectedPromotionId(promotionId || null);
                              setStep(2);
                            }}
                          />
                          <h2 className="text-xl font-semibold mb-4">Selecciona un Servicio</h2>
                          {loading ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                              <p className="mt-4 text-secondary">Cargando servicios...</p>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {visibleServices.map((service) => (
                                  <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedService(service.id);
                                      setSelectedPromotionId(null); // Clear specific promotion selection
                                      setStep(2);
                                    }}
                                    className={`p-4 rounded-lg border-2 text-left transition-all bg-accent
                                ${selectedService === service.id
                                        ? 'border-primary'
                                        : 'border-default hover:border-primary/50'
                                      }`}
                                  >
                                    <h3 className="font-semibold text-default">{service.name}</h3>
                                    <p className="text-sm text-secondary">{service.description}</p>
                                    <div className="mt-2 flex justify-between items-center">
                                      <span className="text-primary">${service.price}</span>
                                      <span className="text-sm text-secondary">{service.duration} min</span>
                                    </div>
                                  </button>
                                ))}
                              </div>

                              {hasMoreServices && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllServices(!showAllServices)}
                                  className="w-full mt-6 py-3 px-6 bg-primary text-default font-semibold rounded-lg
                              hover:bg-primary-hover transition-colors relative group"
                                >
                                  <div className="relative flex items-center justify-center gap-2">
                                    {showAllServices ? (
                                      <>
                                        <Minus className="w-5 h-5" />
                                        <span>Mostrar Menos Servicios</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-5 h-5" />
                                        <span>Ver Todos los Servicios</span>
                                      </>
                                    )}
                                  </div>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-6">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium"
                          >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Volver a Servicios</span>
                          </button>

                          <div className="bg-accent/40 rounded-xl p-5 border border-primary/10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-primary">
                              <Calendar className="w-6 h-6" />
                              Selecciona Fecha y Hora
                            </h2>
                            <p className="text-secondary mb-6 text-sm">
                              {selectedServiceDetails?.name} - <span className="text-primary font-bold">{selectedServiceDetails?.duration} min</span>  
                              {activePromotion && <span className="ml-2 text-green-500 font-bold">({activePromotion.name})</span>}
                            </p>

                            <div className="space-y-6">
                              <input
                                type="date"
                                value={selectedDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => {
                                  setSelectedDate(e.target.value);
                                  setSelectedTime('');
                                }}
                                className="w-full p-4 bg-secondary rounded-xl border border-default focus:border-primary transition-all outline-none"
                              />

                              {selectedDate && (
                                <AppointmentLockManager
                                  selectedDate={selectedDate}
                                  selectedTime={selectedTime}
                                  clientEmail={clientEmail || 'anonymous'}
                                  clientPhone={clientPhone}
                                  onLockStatusChange={handleLockStatusChange}
                                >
                                  <TimeSlotSelector
                                    selectedDate={selectedDate}
                                    selectedTime={selectedTime}
                                    onTimeSelect={(time) => {
                                      setSelectedTime(time);
                                      if (time) setStep(3);
                                    }}
                                    serviceDuration={selectedServiceDetails?.duration || 30}
                                  />
                                </AppointmentLockManager>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {step === 3 && (
                        <div className="space-y-8 animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium"
                          >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Volver a Fecha</span>
                          </button>

                          <div className="bg-accent/40 rounded-xl p-6 border border-primary/10">
                            <h2 className="text-2xl font-bold mb-6 text-primary flex items-center gap-3">
                              <User className="w-7 h-7" />
                              Tus Datos de Contacto
                            </h2>

                            {renderSummary()}

                            <div className="space-y-5">
                              <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Nombre Completo</label>
                                <input
                                  required
                                  type="text"
                                  value={clientName}
                                  onChange={(e) => setClientName(e.target.value)}
                                  className="w-full p-4 bg-secondary rounded-xl border border-default focus:border-primary transition-all outline-none placeholder:text-secondary/30"
                                  placeholder="Ej. Juan Pérez"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                  <label className="block text-sm font-medium text-secondary mb-2">Teléfono WhatsApp</label>
                                  <input
                                    required
                                    type="tel"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(formatPhoneNumber(e.target.value))}
                                    className="w-full p-4 bg-secondary rounded-xl border border-default focus:border-primary transition-all outline-none placeholder:text-secondary/30 text-primary font-mono"
                                    placeholder="811 000 0000"
                                  />
                                  {phoneError && <p className="mt-2 text-xs text-red-500 font-medium">{phoneError}</p>}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-secondary mb-2">Correo Electrónico</label>
                                  <input
                                    required
                                    type="email"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full p-4 bg-secondary rounded-xl border border-default focus:border-primary transition-all outline-none placeholder:text-secondary/30"
                                    placeholder="juan@ejemplo.com"
                                  />
                                  {emailError && <p className="mt-2 text-xs text-red-500 font-medium text-left">{emailError}</p>}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Notas adicionales (opcional)</label>
                                <textarea
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  className="w-full p-4 bg-secondary rounded-xl border border-default focus:border-primary transition-all outline-none h-32 resize-none placeholder:text-secondary/30"
                                  placeholder="¿Algún detalle especial que debamos saber?"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={submitting}
                              className="w-full mt-8 py-5 bg-gradient-to-r from-primary to-primary-hover text-white font-extrabold rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                              <span className="relative flex items-center justify-center gap-3 text-lg">
                                {submitting ? 'RESERVANDO...' : 'RESERVAR AHORA'}
                                {!submitting && <CheckCircle className="w-6 h-6" />}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {step === 4 && lastAppointment && (
                  <div className="text-center py-12 animate-fadeIn max-w-lg mx-auto">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/10 rounded-full mb-8 relative">
                      <div className="absolute inset-0 bg-green-500 animate-ping opacity-20 rounded-full" />
                      <CheckCircle className="w-16 h-16 text-green-500 relative z-10" />
                    </div>
                    <h2 className="text-4xl font-black mb-6 tracking-tight text-white">¡LISTO, TE ESPERAMOS!</h2>
                    <div className="bg-accent/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 mb-10 text-left shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                      <p className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full" />
                        {lastAppointment.service.name}
                      </p>
                      <div className="space-y-4 text-secondary">
                        <div className="flex items-center gap-4 text-lg">
                          <Calendar className="w-6 h-6 text-primary" />
                          <span className="font-medium text-default">{format(new Date(lastAppointment.date + 'T00:00:00'), "EEEE dd 'de' MMMM", { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-4 text-lg">
                          <Clock className="w-6 h-6 text-primary" />
                          <span className="font-medium text-default">Hora: {lastAppointment.time}</span>
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-8 border-t border-white/5">
                        <a
                          href={generateGoogleCalendarLink(lastAppointment, businessData)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-3 py-4 bg-accent border border-white/10 rounded-2xl hover:bg-accent/80 transition-all font-bold text-sm"
                        >
                          <Plus className="w-5 h-5 text-primary" />
                          AGREGAR A MI CALENDARIO
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-primary font-bold hover:underline tracking-widest uppercase text-xs animate-pulse"
                    >
                       AGENDAR OTRA CITA
                    </button>
                  </div>
                )}
              </div>

              {/* Modals */}
              {showHistoryModal && loginData?.email && (
                <AppointmentHistory
                  email={loginData.email}
                  onClose={() => setShowHistoryModal(false)}
                  onRepeatAppointment={handleRepeatAppointment}
                />
              )}

              {showRatingModal && appointmentId && (
                <RatingSystem
                  appointmentId={appointmentId}
                  clientEmail={clientEmail}
                  onClose={() => setShowRatingModal(false)}
                />
              )}

              {showLoginForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-accent border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
                    <button 
                      onClick={() => setShowLoginForm(false)}
                      className="absolute top-6 right-6 text-secondary/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full z-10"
                      aria-label="Cerrar modal"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/0" />
                    <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                      <User className="w-7 h-7 text-primary" />
                      Acceder a tu Perfil
                    </h3>
                    <form onSubmit={handleLogin} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">Correo Electrónico</label>
                        <input
                          required
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full p-4 bg-secondary rounded-xl border border-white/5 focus:border-primary transition-all outline-none"
                          placeholder="juan@ejemplo.com"
                        />
                        {emailError && <p className="mt-2 text-xs text-red-500">{emailError}</p>}
                      </div>
                      <button
                        type="submit"
                        className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                      >
                        CONTINUAR
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLoginForm(false)}
                        className="w-full text-secondary text-sm hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <footer className="mt-20 py-12 border-t border-white/5 bg-accent/20">
                <div className="container mx-auto px-4 text-center">
                  <div className="flex justify-center gap-6 mb-8">
                    <ThemeButton />
                  </div>
                  <p className="text-secondary/60 text-sm mb-4">
                    © {new Date().getFullYear()} {businessData?.name}. Todos los derechos reservados.
                  </p>
                  <button
                    onClick={() => setIsAdminView(true)}
                    className="text-[10px] uppercase tracking-widest text-primary/40 hover:text-primary transition-colors font-bold flex items-center gap-2 mx-auto"
                  >
                    <Settings className="w-3 h-3" />
                    Acceso Administrador
                  </button>
                </div>
              </footer>

              <svg className="hidden">
                <symbol id="store-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </symbol>
              </svg>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;