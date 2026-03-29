import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, Service } from '../types';
import { Calendar, Clock, Store, ArrowLeft, Star, Repeat } from 'lucide-react';
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
          
          // Fetch services for these appointments
          const serviceIds = [...new Set(appointmentsData.map(a => a.service_id))];
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .in('id', serviceIds);

          if (servicesError) throw servicesError;

          const servicesMap: Record<string, Service> = {};
          servicesData?.forEach((service: Service) => {
            servicesMap[service.id] = service;
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

    async function fetchLoyaltyPoints() {
      if (!email) return;
      try {
        // Find by phone from the first appointment or just fetch by email if we had it, 
        // but the table is keyed by phone. We'll fetch appointments first to get the phone.
      } catch (e) {}
    }

    fetchAppointments();
  }, [email]);

  // Separate effect for loyalty points once we have a phone number from appointments
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-accent rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-default flex items-center justify-between">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Cerrar historial"
          >
            <ArrowLeft className="w-5 h-5 text-default" />
          </button>
          <h2 className="text-xl font-semibold text-default">Tu Historial de Citas</h2>
          <div className="w-5"></div> {/* Spacer for centering */}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loyaltyPoints !== null && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-full">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-secondary uppercase font-bold tracking-wider">Mis Puntos</p>
                  <p className="text-2xl font-bold text-primary">{loyaltyPoints}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-secondary">¡Tienes puntos listos!</p>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p>No tienes citas previas</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {appointments.map((appointment) => {
                const service = services[appointment.service_id];
                return (
                  <li key={appointment.id} className="border border-default rounded-lg p-4 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-default">{service?.name || 'Servicio no disponible'}</h3>
                      <button 
                        onClick={() => handleRepeatAppointment(appointment)}
                        className="text-primary hover:text-primary-hover flex items-center gap-1 text-sm"
                        aria-label="Repetir esta cita"
                      >
                        <Repeat className="w-4 h-4" />
                        <span>Repetir</span>
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(appointment.date), 'PPP', { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{appointment.time}</span>
                      </div>
                      {service && (
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          <span>{service.description}</span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}