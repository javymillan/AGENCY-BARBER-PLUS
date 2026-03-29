import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
  is_featured: boolean;
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setTestimonials(data || []);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null; // No mostrar nada si no hay testimonios
  }

  return (
    <section className="py-8 px-4 animate-fadeIn">
      <h2 className="text-2xl font-bold text-default text-center mb-6">Lo que dicen nuestros clientes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <div 
            key={testimonial.id} 
            className="bg-accent p-6 rounded-lg shadow-md border border-default transition-transform hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center mb-4">
              <div className="flex space-x-1 mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-text-secondary text-sm">{testimonial.rating}/5</span>
            </div>
            
            <p className="text-default mb-4 italic">"{testimonial.comment}"</p>
            
            <p className="text-text-secondary text-sm font-medium">
              - {testimonial.client_name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}