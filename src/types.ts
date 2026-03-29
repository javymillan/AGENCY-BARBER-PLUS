export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export interface ServicePromotion {
  id: string;
  service_id: string;
  name: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  start_date: string;
  end_date: string;
  days_of_week?: number[];
  active: boolean;
  service?: Service; // For joining
}

export interface Appointment {
  id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  date: string;
  time: string;
  created_at: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  services?: Service; // Relation
}

export interface TimeSlot {
  time: string;
  available: boolean;
  availableSpots?: number;
}

export interface BusinessData {
  id: string;
  name: string;
  address: string;
  phone: string;
  logo_url?: string;
  description?: string;
  instagram_url?: string;
  facebook_url?: string;
  primary_color?: string;
  accent_color?: string;
  cancellation_policy?: string;
  created_at: string;
  gallery?: GalleryImage[];
}

export interface GalleryImage {
  id: string;
  business_id: string;
  image_url: string;
  caption?: string;
  order_index: number;
}

export interface BusinessHours {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
  break_start: string;
  break_end: string;
}

export interface BlockedTime {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
}

export interface BookingRules {
  id: string;
  appointment_duration: number | null;
  min_advance_time: number | null;
  max_appointments_per_day: number | null;
  max_appointments_per_week: number | null;
  min_cancellation_notice: number | null;
  created_at: string | null;
  updated_at: string | null;
  num_de_empleados: number;
}

export interface AvailableTimeSlot {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface Testimonial {
  id: string;
  appointment_id: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
  is_featured: boolean;
}

export const DAYS_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];