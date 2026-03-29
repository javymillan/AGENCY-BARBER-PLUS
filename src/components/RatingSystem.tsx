import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface RatingSystemProps {
  appointmentId: string;
  clientEmail: string;
  onClose: () => void;
}

interface Testimonial {
  id: string;
  appointment_id: string;
  rating: number;
  comment: string;
  client_name: string;
  created_at: string;
  is_featured: boolean;
}

export const RatingSystem = React.memo(({ appointmentId, clientEmail, onClose }: RatingSystemProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [existingRating, setExistingRating] = useState<Testimonial | null>(null);
  const [clientName, setClientName] = useState<string>('');

  useEffect(() => {
    async function checkExistingRating() {
      if (!appointmentId) return;
      
      try {
        // First get client name from appointment
        const { data: appointmentData } = await supabase
          .from('appointments')
          .select('client_name')
          .eq('id', appointmentId)
          .single();

        if (appointmentData) {
          setClientName(appointmentData.client_name);
        }

        // Check for existing testimonial - remove .single() to avoid PGRST116 error
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('appointment_id', appointmentId);

        if (error) {
          throw error;
        }

        // Check if data array has any results
        if (data && data.length > 0) {
          const testimonial = data[0] as Testimonial;
          setExistingRating(testimonial);
          setRating(testimonial.rating);
          setComment(testimonial.comment);
        }
      } catch (error) {
        console.error('Error checking existing rating:', error);
      }
    }

    checkExistingRating();
  }, [appointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    setSubmitting(true);
    
    try {
      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('testimonials')
          .update({
            rating,
            comment
          })
          .eq('id', existingRating.id);

        if (error) throw error;
        toast.success('¡Tu valoración ha sido actualizada!');
      } else {
        // Create new rating
        const { error } = await supabase
          .from('testimonials')
          .insert([
            {
              appointment_id: appointmentId,
              client_name: clientName,
              rating,
              comment,
              is_featured: false
            }
          ]);

        if (error) throw error;
        toast.success('¡Gracias por tu valoración!');
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('No se pudo guardar tu valoración');
    } finally {
      setSubmitting(false);
    }
  };

  // Memoizar la función de envío para evitar recreaciones innecesarias
  const handleSubmitCallback = useCallback(handleSubmit, [rating, comment, existingRating, onClose]);
  
  // Memoizar las estrellas de calificación
  const ratingStars = useMemo(() => {
    return (
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none transition-transform hover:scale-110"
            aria-label={`Calificar ${star} estrellas`}
          >
            <Star
              className={`w-8 h-8 ${(hoveredRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  }, [hoveredRating, rating]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
            {existingRating ? '¡Actualiza tu valoración!' : '¿Cómo calificarías tu experiencia?'}
          </h2>
        </div>

        <form onSubmit={handleSubmitCallback} className="p-8 space-y-6">
          <div className="flex flex-col items-center">
            <p className="mb-4 text-slate-600 dark:text-slate-300 font-medium">
              {existingRating ? 'Tu calificación anterior:' : 'Comparte tu experiencia'}
            </p>
            {ratingStars}
          </div>

          <div>
            <label htmlFor="comment" className="block mb-3 text-slate-700 dark:text-slate-200 font-medium">
              Comentario
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={4}
              placeholder="Comparte tu experiencia con nosotros..."
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
              disabled={submitting}
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : existingRating ? 'Actualizar' : 'Enviar valoración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default RatingSystem;