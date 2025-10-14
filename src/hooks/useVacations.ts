import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

type VacationRequest = Database['public']['Tables']['vacation_requests']['Row'];
type VacationBalance = Database['public']['Tables']['vacation_balance']['Row'];

export function useVacations() {
  const { user, profile } = useAuth();
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [vacationBalance, setVacationBalance] = useState<VacationBalance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      fetchVacationRequests();
      fetchVacationBalance();
    }
  }, [user, profile]);

  const fetchVacationRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase.from('vacation_requests').select('*');
      
      // If employee, only show their requests
      if (profile?.role === 'employee') {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setVacationRequests(data || []);
    } catch (error) {
      console.error('Error fetching vacation requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVacationBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vacation_balance')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setVacationBalance(data);
    } catch (error) {
      console.error('Error fetching vacation balance:', error);
    }
  };

  const createVacationRequest = async (request: Omit<VacationRequest, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at' | 'total_days'>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      const currentYear = new Date().getFullYear();
      
      // Validar que las fechas estén en el año actual o enero/febrero del siguiente
      const isValidDate = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed (0 = enero, 1 = febrero)
        
        // Año actual: cualquier mes
        if (year === currentYear) return true;
        
        // Año siguiente: solo enero (0) y febrero (1)
        if (year === currentYear + 1 && (month === 0 || month === 1)) return true;
        
        return false;
      };
      
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        throw new Error('Las vacaciones solo pueden solicitarse para el año en curso o enero/febrero del año siguiente');
      }
      
      const timeDiff = endDate.getTime() - startDate.getTime();
      const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

      // Check if user has enough vacation days
      if (vacationBalance && totalDays > vacationBalance.remaining_days) {
        // Create a warning object that can be returned
        const warningData = {
          warning: true,
          message: `Solicitud excede días disponibles. Solicitados: ${totalDays}, Disponibles: ${vacationBalance.remaining_days}. Se enviará a administración para revisión.`,
          requestedDays: totalDays,
          availableDays: vacationBalance.remaining_days
        };
        
        // Still create the request but with a special status or note
        const { data, error } = await supabase
          .from('vacation_requests')
          .insert({
            ...request,
            user_id: user.id,
            total_days: totalDays,
            status: 'pending',
            reason: request.reason ? `${request.reason} [EXCEDE DÍAS DISPONIBLES: ${totalDays}/${vacationBalance.remaining_days}]` : `[EXCEDE DÍAS DISPONIBLES: ${totalDays}/${vacationBalance.remaining_days}]`
          })
          .select()
          .single();

        if (error) throw error;
        await fetchVacationRequests();
        return { ...data, ...warningData };
      }

      const { data, error } = await supabase
        .from('vacation_requests')
        .insert({
          ...request,
          user_id: user.id,
          total_days: totalDays,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      await fetchVacationRequests();
      return data;
    } catch (error) {
      console.error('Error creating vacation request:', error);
      throw error;
    }
  };

  const updateVacationRequest = async (id: string, updates: Partial<VacationRequest>) => {
    try {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update({
          ...updates,
          approved_by: updates.status ? user?.id : undefined,
          approved_at: updates.status ? new Date().toISOString() : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchVacationRequests();
      await fetchVacationBalance();
      return data;
    } catch (error) {
      console.error('Error updating vacation request:', error);
      throw error;
    }
  };

  const deleteVacationRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vacation_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchVacationRequests();
    } catch (error) {
      console.error('Error deleting vacation request:', error);
      throw error;
    }
  };

  const approveVacationRequest = async (id: string, comments?: string) => {
    return updateVacationRequest(id, { 
      status: 'approved',
      comments 
    });
  };

  const rejectVacationRequest = async (id: string, comments?: string) => {
    return updateVacationRequest(id, { 
      status: 'rejected',
      comments 
    });
  };

  const getVacationBalanceForUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('vacation_balance')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vacation balance:', error);
      return null;
    }
  };

  return {
    vacationRequests,
    vacationBalance,
    loading,
    createVacationRequest,
    updateVacationRequest,
    deleteVacationRequest,
    approveVacationRequest,
    rejectVacationRequest,
    fetchVacationRequests,
    fetchVacationBalance,
    getVacationBalanceForUser,
  };
}