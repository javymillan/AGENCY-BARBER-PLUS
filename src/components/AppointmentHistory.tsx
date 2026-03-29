import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, Service } from '../types';
import { Calendar, Clock, X, Star, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface AppointmentHistoryProps {
  email: string;
  onClose: () => void;
  onRepeatAppointment: (appointment: Appointment, service: Service) => void;
}

export function AppointmentHistory({ email, onClose, onRepeatAppointment }: AppointmentHistoryProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!email) return;
      
      try {
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_email', email)
          .order('date', { ascending: false });

        if (appointmentsError) throw appointmentsError;

        if (appointmentsData && appointmentsData.length > 0) {
          setAppointments(appointmentsData as Appointment[]);
          
          const serviceIds = [...new Set(appointmentsData.map(a => a.service_id).filter((id): id is string => !!id))];
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .in('id', serviceIds);

          if (servicesError) throw servicesError;

          const servicesMap: Record<string, Service> = {};
          (servicesData || []).forEach((s: any) => {
            servicesMap[s.id] = s as Service;
          });
          
          setServices(servicesMap);
        }
      } catch (error) {
        console.error('Error fetching appointment history:', error);
        toast.error('No se pudo cargar el historial de citas');
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [email]);

  useEffect(() => {
    async function getPoints() {
      if (appointments.length > 0) {
        const phone = appointments[0].client_phone;
        const { data } = await supabase
          .from('loyalty_points')
          .select('points')
          .eq('client_phone', phone)
          .single();
        if (data) setLoyaltyPoints(data.points);
      }
    }
    getPoints();
  }, [appointments]);

  const handleRepeatAppointment = (appointment: Appointment) => {
    const service = services[appointment.service_id];
    if (service) {
      onRepeatAppointment(appointment, service);
    } else {
      toast.error('No se pudo encontrar el servicio seleccionado');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-brand-card border border-brand/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col relative">
        {/* Header decoration */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand via-brand-dark to-transparent opacity-50" />
        
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Mi Perfil</h2>
            <p className="text-[10px] text-white/30 tracking-[0.3em] font-black uppercase mt-1">{email}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
            aria-label="Cerrar historial"
          >
            <X className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loyaltyPoints !== null && (
            <div className="relative group mb-10 overflow-hidden">
               <div className="absolute inset-0 bg-brand/5 blur-xl group-hover:bg-brand/10 transition-colors" />
               <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Star className="w-24 h-24 text-brand rotate-12" />
                 </div>
                 <div className="flex items-center gap-5 relative z-10">
                   <div className="w-14 h-14 bg-brand/20 rounded-2xl flex items-center justify-center border border-brand/40 shadow-[0_0_20px_var(--brand-glow)]">
                     <Star className="w-7 h-7 text-brand fill-brand" />
                   </div>
                   <div>
                     <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mb-1">Club de Fidelidad</p>
                     <p className="text-4xl font-black text-white tracking-tighter italic">
                       {loyaltyPoints} <span className="text-sm font-black text-brand uppercase tracking-widest not-italic ml-1">Puntos</span>
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          )}
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6 flex items-center gap-3">
             <div className="h-px flex-1 bg-white/5" />
             CITAS RECIENTES
             <div className="h-px flex-1 bg-white/5" />
          </h3>

          {loading ? (
            <div className="flex flex-col justify-center items-center h-48 opacity-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand mb-4"></div>
              <p className="text-xs font-black tracking-widest uppercase">Consultando base de datos...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 px-6 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <Calendar className="w-10 h-10 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-xs font-black tracking-widest uppercase">No se encontraron citas previas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const service = services[appointment.service_id];
                return (
                  <div key={appointment.id} className="relative group">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/[0.08] hover:border-white/10 group-hover:scale-[1.01]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-black text-white tracking-tight uppercase italic text-lg">{service?.name || 'Servicio'}</h4>
                          <div className="flex items-center gap-3 mt-1.5 opacity-40">
                            <span className="text-[10px] font-black text-brand uppercase tracking-widest">${service?.price || '0'}</span>
                            <div className="w-1 h-1 rounded-full bg-white/30" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{service?.duration || '0'} min</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRepeatAppointment(appointment)}
                          className="px-4 py-2 bg-brand/10 border border-brand/20 text-brand text-[8px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-brand hover:text-white transition-all flex items-center gap-2"
                        >
                          <Repeat className="w-3 h-3" />
                          Repetir
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                          <Calendar className="w-3 h-3 text-brand" />
                          <span>{format(new Date(appointment.date + 'T00:00:00'), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                          <Clock className="w-3 h-3 text-brand" />
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}