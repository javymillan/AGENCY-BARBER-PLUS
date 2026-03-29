import React, { useState } from 'react';
import type { GalleryImage } from '../types';
import { Camera, Maximize2, X } from 'lucide-react';

interface GallerySectionProps {
  images: GalleryImage[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <section className="mt-16 px-4 max-w-7xl mx-auto animate-fadeIn group">
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="p-3 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Galería de Arte
        </h2>
        <div className="w-16 h-1 bg-primary rounded-full mb-6"></div>
        <p className="text-secondary max-w-xl">
          Descubre el nivel de detalle y pasión que ponemos en cada corte. 
          Nuestros expertos transforman tu visión en realidad.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {images.map((image: GalleryImage, index: number) => (
          <div 
            key={image.id || index} 
            onClick={() => setSelectedImage(image)}
            className="group relative aspect-square overflow-hidden rounded-[2rem] bg-accent/40 border border-white/5 cursor-pointer shadow-2xl hover:shadow-primary/30 transition-all duration-700 hover:-translate-y-2"
          >
            {/* Glossy Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            
            <img 
              src={image.image_url} 
              alt={image.caption || `Corte de cabello ${index + 1}`}
              className="h-full w-full object-contain bg-black/50 transition-transform duration-1000 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Premium Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8 z-20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                  <h3 className="text-white text-lg font-bold mb-1">
                    {image.caption || 'Estilo Signature'}
                  </h3>
                  <p className="text-primary text-xs font-semibold tracking-widest uppercase">
                    AGENCY BARBER PLUS
                  </p>
                </div>
                <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl text-white transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Subtle numbering */}
            <div className="absolute top-6 left-6 text-white/20 text-4xl font-black italic pointer-events-none group-hover:text-primary/40 transition-colors">
              {(index + 1).toString().padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>

      {/* Premium Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
          
          <button 
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[110]"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-10 h-10" />
          </button>

          <div 
            className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center z-[105]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group w-full h-full flex items-center justify-center">
              <img 
                src={selectedImage.image_url} 
                alt={selectedImage.caption || 'Preview'}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(var(--primary-rgb),0.2)] animate-scaleUp"
              />
              {selectedImage.caption && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="inline-block px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white font-medium border border-white/10">
                    {selectedImage.caption}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

