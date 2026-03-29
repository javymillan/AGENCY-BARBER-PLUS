import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeButton() {
  const [isDark, setIsDark] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div
      className={`fixed bottom-24 right-5 z-50 transition-all duration-300 ${
        isHovered ? 'scale-110' : 'scale-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => setIsDark(!isDark)}
        aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
        className={`relative flex items-center justify-center w-16 h-16 
          ${isDark ? 'bg-slate-700' : 'bg-sky-400'} 
          rounded-full shadow-lg hover:shadow-xl transition-all duration-300 
          before:content-[''] before:absolute before:inset-0 before:rounded-full 
          before:bg-white before:scale-0 hover:before:scale-105 before:opacity-20 
          before:transition-transform before:duration-300`}
      >
        {isDark ? (
          <Sun className={`w-8 h-8 text-amber-300 transition-transform duration-300 ${
            isHovered ? 'rotate-12' : ''
          }`} />
        ) : (
          <Moon className={`w-8 h-8 text-slate-700 transition-transform duration-300 ${
            isHovered ? 'rotate-12' : ''
          }`} />
        )}
      </button>
    </div>
  );
}