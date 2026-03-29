import { supabase } from './supabase';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Service, BusinessData } from '../types';

interface AppointmentData {
  service: Service;
  date: string;
  time: string;
  client: {
    name: string;
    phone: string;
    email: string;
  };
  notes?: string;
  promotion?: {
    name: string;
    discount: string;
    finalPrice: number;
  };
}

export async function getBusinessData(): Promise<BusinessData | null> {
  try {
    const { data, error } = await supabase
      .from('business_data')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching business data:', error);
      return null;
    }

    return data ? {
      ...data,
      logo_url: data.logo_url || undefined,
      cancellation_policy: data.cancellation_policy || undefined
    } as BusinessData : null;
  } catch (error) {
    console.error('Error in getBusinessData:', error);
    return null;
  }
}

export function generateGoogleCalendarLink(appointmentData: AppointmentData, businessData: { name: string; address: string }): string {
  const { date, time, service } = appointmentData;
  // Create date objects
  const startDateTime = new Date(`${date}T${time}`);
  const endDateTime = addMinutes(startDateTime, service.duration);

  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  // We use local time by constructing the string manually
  const formatLocalTime = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const start = formatLocalTime(startDateTime);
  const end = formatLocalTime(endDateTime);

  // Create a more friendly title
  const title = encodeURIComponent(`Cita en ${businessData.name || 'Barbería'} - ${service.name}`);

  // Keep details minimal and relevant to the user
  let detailsText = `Servicio: ${service.name}`;
  if (appointmentData.notes) {
    detailsText += `\nNotas: ${appointmentData.notes}`;
  }

  const details = encodeURIComponent(detailsText);
  const location = encodeURIComponent(businessData.address);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export async function sendClientWhatsAppNotification(
  appointmentData: AppointmentData
): Promise<boolean> {
  try {
    const businessData = await getBusinessData();
    if (!businessData) {
      console.warn('Business data not available for WhatsApp notification');
      return false;
    }

    // Create a date object with the time component to avoid timezone issues
    const appointmentDate = new Date(appointmentData.date + 'T00:00:00');
    const formattedDate = format(appointmentDate, "dd/MM/yyyy EEEE", { locale: es });

    const message =
      `Hola, soy ${appointmentData.client.name} y he reservado mi cita.\n\n` +
      `📅 Fecha: ${formattedDate}\n` +
      `⏰ Hora: ${appointmentData.time}\n` +
      `✂️ Servicio: ${appointmentData.service.name}\n` +
      `📍 Dirección: ${businessData.address}\n` +
      `⏱️ Duración estimada: ${appointmentData.service.duration} minutos\n` +
      (appointmentData.promotion
        ? `🏷️ Promoción: ${appointmentData.promotion.name} (${appointmentData.promotion.discount})\n` +
        `💰 Costo con descuento: $${appointmentData.promotion.finalPrice}\n` +
        `💰 Ahorro: $${appointmentData.service.price - appointmentData.promotion.finalPrice}\n\n`
        : `💰 Costo total: $${appointmentData.service.price}\n\n`) +
      `Agrega tu cita al calendario 👇\n${generateGoogleCalendarLink(appointmentData, businessData)}\n\n` +
      `📋 Política de cancelación:\n${businessData.cancellation_policy || 'Contacta para más información'}`;

    let businessPhone = businessData.phone.replace(/\D/g, '');
    if (!businessPhone.startsWith('52')) {
      businessPhone = '52' + businessPhone;
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${businessPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    return true;
  } catch (error) {
    console.warn('Error in sendClientWhatsAppNotification:', error);
    return false;
  }
}

export async function sendBusinessWhatsAppNotification(
  _appointmentData: AppointmentData
): Promise<boolean> {
  return true;
}