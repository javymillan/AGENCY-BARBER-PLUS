import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AppointmentLock {
  id: string;
  date: string;
  time: string;
  locked_by: string;
  locked_at: string;
  expires_at: string;
}

interface AppointmentLockManagerProps {
  selectedDate: string;
  selectedTime: string;
  clientEmail: string;
  clientPhone?: string;
  onLockStatusChange: (isLocked: boolean, lockedBy?: string) => void;
  children: React.ReactNode;
}

export function AppointmentLockManager({
  selectedDate,
  selectedTime,
  clientEmail,
  clientPhone,
  onLockStatusChange,
  children
}: AppointmentLockManagerProps) {
  const [currentLock, setCurrentLock] = useState<AppointmentLock | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const [lockExpiry, setLockExpiry] = useState<Date | null>(null);

  // Verificar y gestionar bloqueos
  useEffect(() => {
    if (!selectedDate || !selectedTime) {
      setCurrentLock(null);
      onLockStatusChange(false);
      return;
    }

    // Verificar si hay identificador válido antes de gestionar locks
    const userIdentifier = getUserIdentifier();
    if (!userIdentifier) {
      // No hay identificador válido, no gestionar locks
      setCurrentLock(null);
      onLockStatusChange(false);
      return;
    }

    checkAndManageLock();
  }, [selectedDate, selectedTime, clientEmail, clientPhone]);

  // Limpiar bloqueos expirados periódicamente
  useEffect(() => {
    const interval = setInterval(cleanExpiredLocks, 30000); // cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const checkAndManageLock = async () => {
    try {
      // Crear identificador único para el usuario
      const userIdentifier = getUserIdentifier();

      // Si no hay identificador válido, NO crear lock ni validar
      if (!userIdentifier) {
        console.log('⚠️ No valid user identifier - skipping lock management');
        setCurrentLock(null);
        onLockStatusChange(false);
        return;
      }

      // Verificar si hay un bloqueo existente
      const { data: existingLocks, error } = await supabase
        .from('appointment_locks')
        .select('*')
        .eq('date', selectedDate)
        .eq('time', selectedTime)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      const activeLock = existingLocks?.[0];

      if (activeLock) {
        // Verificar si el lock pertenece al usuario actual
        const isOwnLock = isUserLock(activeLock.locked_by, userIdentifier);

        if (isOwnLock) {
          // El usuario actual tiene el bloqueo
          setCurrentLock(activeLock);
          setLockExpiry(new Date(activeLock.expires_at));
          onLockStatusChange(false); // No está bloqueado para este usuario

          // Extender el bloqueo
          await extendLock(activeLock.id);
          console.log('✅ Extended own lock for user:', userIdentifier);
        } else {
          // Otro usuario tiene el bloqueo
          setCurrentLock(activeLock);
          setLockExpiry(new Date(activeLock.expires_at));
          onLockStatusChange(true, activeLock.locked_by);

          console.log('❌ Lock belongs to another user:', activeLock.locked_by);
          toast.error(`Este horario está siendo reservado por otro usuario`);
        }
      } else {
        // No hay bloqueo, crear uno nuevo
        await createLock();
      }
    } catch (error) {
      console.error('Error managing lock:', error);
    }
  };

  // Función para obtener identificador único del usuario
  const getUserIdentifier = () => {
    // Si el usuario tiene historial (email real), usar el email
    if (clientEmail && !clientEmail.includes('@temp.com') && !clientEmail.startsWith('phone_') && clientEmail !== 'anonymous') {
      return clientEmail;
    }

    // Si es usuario nuevo con teléfono, usar el teléfono
    if (clientPhone) {
      return clientPhone;
    }

    // Si tiene email temporal válido, usarlo
    if (clientEmail && clientEmail !== 'anonymous') {
      return clientEmail;
    }

    // NO retornar 'anonymous' - retornar null si no hay identificador válido
    return null;
  };

  // Función para verificar si un lock pertenece al usuario actual
  const isUserLock = (lockOwner: string, currentUserIdentifier: string | null) => {
    // Si no hay identificador válido, el lock no puede ser del usuario
    if (!currentUserIdentifier) return false;

    // Comparación directa
    if (lockOwner === currentUserIdentifier) return true;

    // Si el lock es por teléfono y el usuario actual también usa teléfono
    if (clientPhone && lockOwner === clientPhone) return true;

    // Si el lock es por email y el usuario actual también usa email
    if (clientEmail && clientEmail !== 'anonymous' && lockOwner === clientEmail) return true;

    // Verificar si el lock contiene el teléfono del usuario (para casos de email temporal)
    if (clientPhone && lockOwner.includes(clientPhone.replace('+52', ''))) return true;

    return false;
  };

  const createLock = async () => {
    if (isLocking) return;

    // Obtener identificador y validar
    const lockIdentifier = getUserIdentifier();
    if (!lockIdentifier) {
      console.log('⚠️ Cannot create lock without valid user identifier');
      return;
    }

    setIsLocking(true);
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      const { data, error } = await supabase
        .from('appointment_locks')
        .insert([
          {
            date: selectedDate,
            time: selectedTime,
            locked_by: lockIdentifier,
            expires_at: expiresAt.toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentLock(data);
      setLockExpiry(expiresAt);
      onLockStatusChange(false);

      console.log('✅ Created lock for user:', lockIdentifier);
      toast.success('Horario reservado temporalmente');
    } catch (error) {
      console.error('Error creating lock:', error);
      toast.error('No se pudo reservar el horario');
    } finally {
      setIsLocking(false);
    }
  };

  const extendLock = async (lockId: string) => {
    try {
      const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const { error } = await supabase
        .from('appointment_locks')
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq('id', lockId);

      if (error) throw error;

      setLockExpiry(newExpiresAt);
    } catch (error) {
      console.error('Error extending lock:', error);
    }
  };

  const releaseLock = async () => {
    if (!currentLock) return;

    try {
      const { error } = await supabase
        .from('appointment_locks')
        .delete()
        .eq('id', currentLock.id);

      if (error) throw error;

      setCurrentLock(null);
      setLockExpiry(null);
      onLockStatusChange(false);
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  };

  const cleanExpiredLocks = async () => {
    try {
      const { error } = await supabase
        .from('appointment_locks')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning expired locks:', error);
    }
  };

  // Countdown timer para mostrar tiempo restante
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!lockExpiry) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, lockExpiry.getTime() - Date.now());
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setCurrentLock(null);
        setLockExpiry(null);
        onLockStatusChange(false);
        toast.warning('La reserva temporal ha expirado');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiry]);

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      {children}
      
      {/* Indicador de estado de bloqueo */}
      {currentLock && (
        <div className="mt-4 p-3 rounded-lg border">
          {isUserLock(currentLock.locked_by, getUserIdentifier()) ? (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border-green-200">
              <Lock className="w-4 h-4" />
              <span className="text-sm">
                Horario reservado temporalmente - Tiempo restante: {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border-red-200">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                Este horario está siendo reservado por otro usuario
              </span>
            </div>
          )}
        </div>
      )}

      {/* Overlay de bloqueo */}
      {currentLock && 
       !isUserLock(currentLock.locked_by, getUserIdentifier()) && (
        <div className="absolute inset-0 bg-gray-500/50 rounded-lg flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Horario no disponible</p>
            <p className="text-xs text-gray-600">Siendo reservado por otro usuario</p>
          </div>
        </div>
      )}
    </div>
  );
}