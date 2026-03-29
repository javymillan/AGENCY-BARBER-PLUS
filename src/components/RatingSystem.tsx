import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Star, X, MessageSquare, Send } from 'lucide-react';
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
        const { data: appointmentData } = await supabase
          .from('appointments')
          .select('client_name')
          .eq('id', appointmentId)
          .single();

        if (appointmentData) {
          setClientName(appointmentData.client_name);
        }

        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('appointment_id', appointmentId);

        if (error) throw error;

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

  const handleSubmitCallback = useCallback(handleSubmit, [rating, comment, existingRating, onClose, clientName, appointmentId]);
  
  const ratingStars = useMemo(() => {
    return (
      <div className="flex space-x-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none transition-all hover:scale-125 transform"
            aria-label={`Calificar ${star} estrellas`}
          >
            <Star
              className={`w-10 h-10 ${(hoveredRating || rating) >= star ? 'fill-brand text-brand drop-shadow-[0_0_10px_var(--brand-glow)]' : 'text-white/10'} transition-all duration-300`}
            />
          </button>
        ))}
      </div>
    );
  }, [hoveredRating, rating]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-brand-card border border-brand/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand via-brand-dark to-transparent opacity-50" />
        
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex-1 text-center">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
              {existingRating ? 'Actualizar Reseña' : 'Tu Experiencia'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-8 p-2 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmitCallback} className="p-8 space-y-8">
          <div className="flex flex-col items-center">
            <p className="mb-6 text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">
              {existingRating ? 'Calificación guardada' : 'Selecciona una puntuación'}
            </p>
            {ratingStars}
          </div>

          <div className="relative group">
            <label htmlFor="comment" className="block mb-3 text-[10px] text-white/30 font-black uppercase tracking-[0.2em] ml-1">
              Testimonio
            </label>
            <div className="relative">
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-brand/40 transition-all outline-none h-40 resize-none text-sm font-medium pr-12"
                placeholder="Cuéntanos cómo fue tu servicio..."
              />
              <MessageSquare className="absolute top-5 right-5 w-5 h-5 text-white/10 group-focus-within:text-brand/40 transition-colors" />
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-brand text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_var(--brand-glow)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {submitting ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white/30" />
              ) : (
                <>
                  {existingRating ? 'ACTUALIZAR RESEÑA' : 'PUBLICAR COMENTARIO'}
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-4 text-[10px] text-white/20 hover:text-white/40 font-black uppercase tracking-widest transition-colors py-2"
            >
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default RatingSystem;