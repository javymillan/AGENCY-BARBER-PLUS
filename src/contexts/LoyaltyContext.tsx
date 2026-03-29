import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { LoyaltyPoints, LoyaltyReward, LoyaltyRedemption } from '../types/nuevas-funcionalidades';
import { Appointment } from '../types';
import { toast } from 'react-toastify';

interface LoyaltyContextType {
  loyaltyPoints: LoyaltyPoints[];
  loyaltyRewards: LoyaltyReward[];
  loyaltyRedemptions: LoyaltyRedemption[];
  loading: boolean;
  error: string | null;
  getClientPoints: (clientPhone: string) => LoyaltyPoints | null;
  addPointsForAppointment: (appointment: Appointment) => Promise<LoyaltyPoints | null>;
  redeemReward: (clientPhone: string, rewardId: string, appointmentId?: string) => Promise<LoyaltyRedemption | null>;
  createReward: (reward: Omit<LoyaltyReward, 'id' | 'created_at'>) => Promise<LoyaltyReward | null>;
  updateReward: (id: string, reward: Partial<LoyaltyReward>) => Promise<LoyaltyReward | null>;
  deleteReward: (id: string) => Promise<boolean>;
  getAvailableRewards: (clientPhone: string) => LoyaltyReward[];
  getClientRedemptions: (clientPhone: string) => LoyaltyRedemption[];
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty debe ser usado dentro de un LoyaltyProvider');
  }
  return context;
};

interface LoyaltyProviderProps {
  children: React.ReactNode;
}

// Puntos por defecto que se otorgan por cada cita completada
const DEFAULT_POINTS_PER_APPOINTMENT = 10;

export const LoyaltyProvider: React.FC<LoyaltyProviderProps> = ({ children }) => {
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([]);
  const [loyaltyRedemptions, setLoyaltyRedemptions] = useState<LoyaltyRedemption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de fidelización
  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar puntos de fidelidad
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('*');

      if (pointsError) throw pointsError;
      setLoyaltyPoints(pointsData || []);

      // Cargar recompensas
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('active', true);

      if (rewardsError) throw rewardsError;
      setLoyaltyRewards(rewardsData || []);

      // Cargar canjes
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('loyalty_redemptions')
        .select('*');

      if (redemptionsError) throw redemptionsError;
      setLoyaltyRedemptions(redemptionsData || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos de fidelización');
      console.error('Error al cargar datos de fidelización:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener puntos de un cliente
  const getClientPoints = useCallback((clientPhone: string) => {
    return loyaltyPoints.find(lp => lp.client_phone === clientPhone) || null;
  }, [loyaltyPoints]);

  // Añadir puntos por una cita completada
  const addPointsForAppointment = useCallback(async (appointment: Appointment) => {
    try {
      // Verificar si la cita ya ha otorgado puntos
      if (appointment.loyalty_points_added) {
        return null;
      }

      // Buscar si el cliente ya tiene puntos
      const existingPoints = getClientPoints(appointment.client_phone);
      const now = new Date().toISOString();
      
      let result;
      
      if (existingPoints) {
        // Actualizar puntos existentes
        const { data, error } = await supabase
          .from('loyalty_points')
          .update({
            points: existingPoints.points + DEFAULT_POINTS_PER_APPOINTMENT,
            total_earned: existingPoints.total_earned + DEFAULT_POINTS_PER_APPOINTMENT,
            last_appointment_id: appointment.id,
            updated_at: now
          })
          .eq('id', existingPoints.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        
        // Actualizar estado local
        setLoyaltyPoints(loyaltyPoints.map(lp => 
          lp.id === existingPoints.id ? result : lp
        ));
      } else {
        // Crear nuevo registro de puntos
        const { data, error } = await supabase
          .from('loyalty_points')
          .insert({
            client_phone: appointment.client_phone,
            client_name: appointment.client_name,
            points: DEFAULT_POINTS_PER_APPOINTMENT,
            total_earned: DEFAULT_POINTS_PER_APPOINTMENT,
            last_appointment_id: appointment.id,
            created_at: now,
            updated_at: now
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
        
        // Actualizar estado local
        setLoyaltyPoints([...loyaltyPoints, result]);
      }
      
      // Marcar la cita como procesada para puntos
      await supabase
        .from('appointments')
        .update({ loyalty_points_added: true })
        .eq('id', appointment.id);
      
      toast.success(`¡${DEFAULT_POINTS_PER_APPOINTMENT} puntos añadidos a ${appointment.client_name}!`);
      return result;
    } catch (err) {
      console.error('Error al añadir puntos:', err);
      toast.error('Error al añadir puntos de fidelidad');
      return null;
    }
  }, [loyaltyPoints, getClientPoints]);

  // Canjear una recompensa
  const redeemReward = useCallback(async (clientPhone: string, rewardId: string, appointmentId?: string) => {
    try {
      // Obtener puntos del cliente
      const clientPointsRecord = getClientPoints(clientPhone);
      if (!clientPointsRecord) {
        toast.error('El cliente no tiene puntos acumulados');
        return null;
      }
      
      // Obtener la recompensa
      const reward = loyaltyRewards.find(r => r.id === rewardId);
      if (!reward) {
        toast.error('Recompensa no encontrada');
        return null;
      }
      
      // Verificar si tiene suficientes puntos
      if (clientPointsRecord.points < reward.points_required) {
        toast.error('Puntos insuficientes para canjear esta recompensa');
        return null;
      }
      
      // Crear registro de canje
      const { data: redemptionData, error: redemptionError } = await supabase
        .from('loyalty_redemptions')
        .insert({
          client_phone: clientPhone,
          reward_id: rewardId,
          points_used: reward.points_required,
          appointment_id: appointmentId,
          status: 'active'
        })
        .select()
        .single();

      if (redemptionError) throw redemptionError;
      
      // Actualizar puntos del cliente
      const { data: updatedPoints, error: pointsError } = await supabase
        .from('loyalty_points')
        .update({
          points: clientPointsRecord.points - reward.points_required,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientPointsRecord.id)
        .select()
        .single();

      if (pointsError) throw pointsError;
      
      // Actualizar estados locales
      setLoyaltyRedemptions([...loyaltyRedemptions, redemptionData]);
      setLoyaltyPoints(loyaltyPoints.map(lp => 
        lp.id === clientPointsRecord.id ? updatedPoints : lp
      ));
      
      toast.success(`¡Recompensa canjeada correctamente!`);
      return redemptionData;
    } catch (err) {
      console.error('Error al canjear recompensa:', err);
      toast.error('Error al canjear la recompensa');
      return null;
    }
  }, [loyaltyPoints, loyaltyRewards, loyaltyRedemptions, getClientPoints]);

  // Crear una nueva recompensa
  const createReward = useCallback(async (reward: Omit<LoyaltyReward, 'id' | 'created_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('loyalty_rewards')
        .insert([{ ...reward, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) throw error;

      setLoyaltyRewards([...loyaltyRewards, data]);
      toast.success('Recompensa creada correctamente');
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la recompensa');
      console.error('Error al crear la recompensa:', err);
      toast.error('Error al crear la recompensa');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loyaltyRewards]);

  // Actualizar una recompensa existente
  const updateReward = useCallback(async (id: string, reward: Partial<LoyaltyReward>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('loyalty_rewards')
        .update(reward)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setLoyaltyRewards(loyaltyRewards.map(r => r.id === id ? { ...r, ...data } : r));
      toast.success('Recompensa actualizada correctamente');
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la recompensa');
      console.error('Error al actualizar la recompensa:', err);
      toast.error('Error al actualizar la recompensa');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loyaltyRewards]);

  // Eliminar una recompensa
  const deleteReward = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLoyaltyRewards(loyaltyRewards.filter(r => r.id !== id));
      toast.success('Recompensa eliminada correctamente');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la recompensa');
      console.error('Error al eliminar la recompensa:', err);
      toast.error('Error al eliminar la recompensa');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loyaltyRewards]);

  // Obtener recompensas disponibles para un cliente
  const getAvailableRewards = useCallback((clientPhone: string) => {
    const clientPointsRecord = getClientPoints(clientPhone);
    if (!clientPointsRecord) return [];
    
    return loyaltyRewards
      .filter(reward => reward.active && clientPointsRecord.points >= reward.points_required)
      .sort((a, b) => a.points_required - b.points_required);
  }, [loyaltyRewards, getClientPoints]);

  // Obtener canjes de un cliente
  const getClientRedemptions = useCallback((clientPhone: string) => {
    return loyaltyRedemptions.filter(redemption => redemption.client_phone === clientPhone);
  }, [loyaltyRedemptions]);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  // Memoizar el valor del contexto para evitar renderizaciones innecesarias
  const value = useMemo(() => ({
    loyaltyPoints,
    loyaltyRewards,
    loyaltyRedemptions,
    loading,
    error,
    getClientPoints,
    addPointsForAppointment,
    redeemReward,
    createReward,
    updateReward,
    deleteReward,
    getAvailableRewards,
    getClientRedemptions
  }), [
    loyaltyPoints,
    loyaltyRewards,
    loyaltyRedemptions,
    loading,
    error,
    getClientPoints,
    addPointsForAppointment,
    redeemReward,
    createReward,
    updateReward,
    deleteReward,
    getAvailableRewards,
    getClientRedemptions
  ]);

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  );
};