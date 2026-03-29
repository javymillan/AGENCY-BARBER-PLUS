import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useRealTimeAvailability } from '../hooks/useRealTimeAvailability';
import toast from 'react-hot-toast';

interface TimeSlotSelectorProps {
  selectedDate: string;
  serviceDuration: number;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  selectedLocation?: string;
  disabled?: boolean;
}

export function TimeSlotSelector({
  selectedDate,
  serviceDuration,
  selectedTime,
  onTimeSelect,
  selectedLocation,
  disabled = false
}: TimeSlotSelectorProps) {
  const [isValidatingSelection, setIsValidatingSelection] = useState(false);
  const [lastValidatedTime, setLastValidatedTime] = useState<string>('');

  const {
    timeSlots,
    loading,
    error,
    lastUpdated,
    isValidating,
    validateSpecificTimeSlot,
    refreshAvailability
  } = useRealTimeAvailability({
    selectedDate,
    serviceDuration,
    selectedLocation,
    refreshInterval: 30000 // 30 segundos
  });

  // Validar el horario seleccionado cuando cambie
  useEffect(() => {
    if (selectedTime && selectedTime !== lastValidatedTime) {
      validateSelectedTime(selectedTime);
    }
  }, [selectedTime, timeSlots]);

  const validateSelectedTime = async (time: string) => {
    if (!time) return;

    setIsValidatingSelection(true);
    try {
      const isAvailable = await validateSpecificTimeSlot(time);
      
      if (!isAvailable && selectedTime === time) {
        toast.error('El horario seleccionado ya no está disponible. Por favor elige otro.');
        onTimeSelect(''); // Limpiar selección
      }
      
      setLastValidatedTime(time);
    } catch (error) {
      console.error('Error validating selected time:', error);
    } finally {
      setIsValidatingSelection(false);
    }
  };

  const handleTimeSelect = async (time: string) => {
    if (disabled) return;

    // Validar disponibilidad antes de seleccionar
    setIsValidatingSelection(true);
    try {
      const isAvailable = await validateSpecificTimeSlot(time);
      
      if (!isAvailable) {
        toast.error('Este horario ya no está disponible. Seleccionando horarios actualizados...');
        refreshAvailability();
        return;
      }

      onTimeSelect(time);
      toast.success('Horario seleccionado correctamente');
    } catch (error) {
      toast.error('Error al validar el horario. Intenta de nuevo.');
    } finally {
      setIsValidatingSelection(false);
    }
  };

  const getTimeSlotStatus = (slot: any) => {
    if (!slot.available) {
      return {
        className: 'bg-white/5 text-white/20 cursor-not-allowed border-red-500/30 border-2 opacity-50',
        colorType: 'red',
        icon: <X className="w-4 h-4" />,
        disabled: true
      };
    }

    if (slot.time === selectedTime) {
      return {
        className: 'bg-primary text-brand-text border-primary border-2 shadow-lg shadow-primary/20 scale-105 z-10',
        colorType: 'brand',
        icon: <CheckCircle className="w-4 h-4" />,
        disabled: false
      };
    }

    // Determinar color basado en disponibilidad
    const availableSpots = slot.availableSpots || 1;
    const totalSpots = slot.totalSpots || 1;
    
    let borderColor = 'border-brand/30';
    let colorType = 'brand';
    
    if (availableSpots === 0) {
      borderColor = 'border-red-500/30';
      colorType = 'red';
    } else if (availableSpots < totalSpots && totalSpots > 1) {
      borderColor = 'border-orange-500/40';
      colorType = 'orange';
    }

    return {
      className: `bg-brand-card text-white ${borderColor} border-2 hover:border-brand hover:bg-brand/10`,
      colorType,
      icon: <Clock className="w-4 h-4 text-brand" />,
      disabled: false
    };
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-default">Hora</label>
          <button
            onClick={refreshAvailability}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={refreshAvailability}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-default">
          Hora
          {isValidating && (
            <span className="ml-2 text-xs text-secondary">(Actualizando...)</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-secondary">
              Actualizado: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refreshAvailability}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover"
            disabled={loading || isValidating}
          >
            <RefreshCw className={`w-4 h-4 ${(loading || isValidating) ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {loading && timeSlots.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-secondary">Cargando horarios disponibles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {timeSlots.map((slot) => {
            const status = getTimeSlotStatus(slot);
            
            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => handleTimeSelect(slot.time)}
                disabled={status.disabled || disabled || isValidatingSelection}
                className={`
                  relative p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200
                  ${status.className}
                  ${status.disabled ? '' : 'hover:scale-105 active:scale-95'}
                  ${isValidatingSelection && slot.time === selectedTime ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  {status.icon}
                  <span>{slot.time}</span>
                </div>
                
                {/* Mostrar información de disponibilidad */}
                {slot.available && slot.availableSpots !== undefined && (
                  <div className="mt-1 text-xs opacity-75">
                    {slot.availableSpots > 1 ? `${slot.availableSpots} disponibles` : 'Último disponible'}
                  </div>
                )}

                {slot.reason && (
                  <div className="mt-1 text-xs opacity-75">
                    {slot.reason}
                  </div>
                )}

                {isValidatingSelection && slot.time === selectedTime && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Leyenda de colores */}
      <div className="mt-8 p-6 bg-brand-card border border-brand/20 backdrop-blur-xl rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl opacity-30" />
        
        <div className="flex items-center gap-3 mb-5">
          <Info className="w-5 h-5 text-brand" />
          <h3 className="font-bold text-white uppercase tracking-widest text-xs">Estado de disponibilidad</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-3 text-white/60">
            <div className="w-5 h-5 rounded-lg border-2 border-brand/40 bg-brand/10"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-3 text-white/60">
            <div className="w-5 h-5 rounded-lg border-2 border-orange-500/40 bg-orange-500/10"></div>
            <span>Limitada</span>
          </div>
          <div className="flex items-center gap-3 text-white/60">
            <div className="w-5 h-5 rounded-lg border-2 border-red-500/30 bg-white/5 opacity-50"></div>
            <span>Ocupado</span>
          </div>
        </div>
        
        {/* Información adicional sobre restricciones */}
        <div className="mt-6 pt-5 border-t border-white/5 text-[9px] text-white/30 space-y-2 uppercase tracking-tighter">
          <p className="flex items-center gap-2">
            <span className="w-1 h-1 bg-brand rounded-full" />
            Sincronización en tiempo real con el personal
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1 h-1 bg-brand rounded-full" />
            Actualización automática cada 30 segundos
          </p>
        </div>
      </div>
      {timeSlots.length === 0 && !loading && (
        <div className="text-center p-8 text-secondary">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay horarios disponibles para esta fecha</p>
          <button
            onClick={refreshAvailability}
            className="mt-2 text-primary hover:text-primary-hover underline"
          >
            Verificar nuevamente
          </button>
        </div>
      )}

      {/* Indicador de estado en tiempo real */}
      <div className="flex items-center justify-between text-xs text-secondary p-2 bg-accent/50 rounded">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isValidating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span>
            {isValidating ? 'Sincronizando...' : 'Sincronizado'}
          </span>
        </div>
        <span>Actualización automática cada 30s</span>
      </div>
    </div>
  );
}