import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { getBusinessData } from '../lib/business';
import type { BusinessData } from '../types';

export function LocationButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBusinessData() {
      const data = await getBusinessData();
      setBusinessData(data);
      setIsLoading(false);
    }

    fetchBusinessData();
  }, []);

  const handleClick = () => {
    setIsClicked(true);
    if (businessData) {
      // Format address for better Google Maps accuracy
      const addressParts = businessData.address.split(',').map(part => part.trim());
      const street = addressParts[0]; // Herminia Valencia 72a
      const colony = addressParts[1].replace('Colonia ', ''); // Remove 'Colonia ' prefix
      const city = addressParts[2]; // Hermosillo

      // Construct a more specific address string
      const fullAddress = `${street}, ${colony}, ${city}, Sonora, México`;
      const encodedAddress = encodeURIComponent(fullAddress);
      
      // Use Google Maps search with specific parameters for better accuracy
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    }
    setTimeout(() => setIsClicked(false), 300);
  };

  if (isLoading) {
    return (
      <button 
        disabled
        className="relative flex items-center gap-2 px-6 py-3 
          bg-primary/50 text-default rounded-lg shadow-lg
          cursor-not-allowed opacity-70"
      >
        <MapPin className="w-5 h-5 animate-pulse" />
        <span className="font-medium">Cargando...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative flex items-center gap-2 px-6 py-3 
        bg-primary text-default rounded-lg shadow-lg
        transform transition-all duration-300
        hover:shadow-xl hover:scale-105
        active:scale-95
        ${isClicked ? 'animate-pulse' : ''}
        before:content-[''] before:absolute before:inset-0 
        before:rounded-lg before:bg-white before:opacity-0 
        hover:before:opacity-20 before:transition-opacity
      `}
      aria-label="Ver ubicación en Google Maps"
    >
      <MapPin 
        className={`w-5 h-5 transition-transform duration-300 ${
          isHovered ? 'scale-110' : ''
        }`}
      />
      <span className="font-medium">Ver Ubicación</span>
    </button>
  );
}