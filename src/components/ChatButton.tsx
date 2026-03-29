import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export function ChatButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ${
        isHovered ? 'scale-110' : 'scale-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        aria-label="Abrir chat de soporte"
        className={`relative flex items-center justify-center w-16 h-16 bg-[#556B67] rounded-full shadow-lg 
          hover:shadow-xl transition-all duration-300 
          before:content-[''] before:absolute before:inset-0 before:rounded-full 
          before:bg-white before:scale-0 hover:before:scale-105 before:opacity-20 
          before:transition-transform before:duration-300`}
      >
        <MessageCircle 
          className={`w-8 h-8 text-white transition-transform duration-300 ${
            isHovered ? 'rotate-12' : ''
          }`}
        />
      </button>
    </div>
  );
}