import { supabase } from './supabase';
import type { BusinessData } from '../types';

const DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

// Fallback business data in case of network issues
const FALLBACK_BUSINESS_DATA: BusinessData = {
  id: 'fallback-id',
  name: 'DEMO BARBER',
  address: 'Herminia Valencia 72a, Colonia Real de minas, Hermosillo',
  phone: '+526621234567',
  logo_url: undefined,
  primary_color: '#000000',
  accent_color: '#ffffff',
  cancellation_policy: 'Las citas pueden cancelarse o reprogramarse hasta 24 horas antes sin costo. Cancelaciones con menos tiempo tendrán un cargo del 50%.',
  created_at: new Date().toISOString(),
  gallery: []
};

export function getDayName(dayNumber: number): string {
  return DAYS[dayNumber];
}

export async function getBusinessData(): Promise<BusinessData | null> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const { data, error } = await supabase
      .from('business_data')
      .select('*')
      .limit(1)
      .abortSignal(controller.signal)
      .single();

    clearTimeout(timeoutId);

    if (error) {
      console.warn('Error fetching business data from database:', error);
      console.log('Using fallback business data');
      return FALLBACK_BUSINESS_DATA;
    }

    // Fetch gallery
    const { data: gallery } = await supabase
      .from('business_gallery')
      .select('*')
      .order('order_index', { ascending: true });

    return {
      ...data,
      gallery: (gallery || []).map(item => ({
        id: item.id,
        business_id: item.business_id || '',
        image_url: item.image_url,
        caption: item.caption || undefined,
        order_index: item.order_index || 0
      }))
    } as BusinessData;
  } catch (error) {
    console.warn('Network error fetching business data:', error);
    console.log('Using fallback business data');
    return FALLBACK_BUSINESS_DATA;
  }
}

export async function getBusinessHours(dayOfWeek: number) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .abortSignal(controller.signal)
      .single();

    clearTimeout(timeoutId);

    if (error) {
      console.warn('Error fetching business hours:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Network error fetching business hours:', error);
    return null;
  }
}

export async function getServices() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name')
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      console.warn('Error fetching services:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.warn('Network error fetching services:', error);
    return [];
  }
}