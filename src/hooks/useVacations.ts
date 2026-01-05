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

  const createVacationRequest = async (request: Omit<VacationRequest, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at' | 'total_days' | 'company_id'>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      
      // Validar que las fechas estén dentro del periodo activo
      if (vacationBalance?.period_start && vacationBalance?.period_end) {
        const periodStart = new Date(vacationBalance.period_start);
        const periodEnd = new Date(vacationBalance.period_end);
        
        if (startDate < periodStart || startDate > periodEnd) {
          throw new Error(`La fecha de inicio debe estar dentro del periodo activo (${formatPeriodDate(vacationBalance.period_start)} - ${formatPeriodDate(vacationBalance.period_end)})`);
        }
        
        if (endDate < periodStart || endDate > periodEnd) {
          throw new Error(`La fecha de fin debe estar dentro del periodo activo (${formatPeriodDate(vacationBalance.period_start)} - ${formatPeriodDate(vacationBalance.period_end)})`);
        }
      }
      
      const timeDiff = endDate.getTime() - startDate.getTime();
      const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

      // Validar que no solicite más días de los disponibles
      if (vacationBalance && totalDays > vacationBalance.remaining_days) {
        throw new Error(`No puede solicitar más días (${totalDays}) de los disponibles (${vacationBalance.remaining_days})`);
      }

      const { data, error } = await supabase
        .from('vacation_requests')
        .insert({
          ...request,
          user_id: user.id,
          company_id: profile?.company_id || null,
          total_days: totalDays,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        // Handle specific database errors
        if (error.message?.includes('solicitud de vacaciones para estas fechas')) {
          throw new Error('Ya tienes una solicitud de vacaciones para estas fechas o parte de ellas');
        }
        if (error.message?.includes('periodo activo')) {
          throw new Error(error.message);
        }
        if (error.message?.includes('más días')) {
          throw new Error(error.message);
        }
        throw error;
      }
      await fetchVacationRequests();
      return data;
    } catch (error: any) {
      console.error('Error creating vacation request:', error);
      throw error;
    }
  };

  const formatPeriodDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

  // Calculate vacation balance for a future period based on hire date
  const calculateFuturePeriodBalance = (periodYear: number, hireDate: string | null): {
    total_days: number;
    used_days: number;
    remaining_days: number;
    period_start: string;
    period_end: string;
  } => {
    const periodStart = new Date(periodYear, 2, 1); // March 1st
    const periodEnd = new Date(periodYear + 1, 1, 28); // Feb 28th
    
    // Default 22 days per year
    let totalDays = 22;
    
    // If hire date exists, calculate proportional days
    if (hireDate) {
      const hire = new Date(hireDate);
      
      // If employee was hired before period start, they get full days
      if (hire < periodStart) {
        totalDays = 22;
      } else if (hire <= periodEnd) {
        // Hired during this period - calculate proportional
        const monthsRemaining = 12 - (hire.getMonth() - 2);
        const daysProportional = Math.round((22 / 12) * Math.max(0, monthsRemaining));
        totalDays = Math.min(22, Math.max(0, daysProportional));
      } else {
        // Hired after period - no days
        totalDays = 0;
      }
    }
    
    // For future periods, used_days starts at 0
    // We need to count approved requests for this period
    const usedDays = vacationRequests
      .filter(req => {
        if (req.status !== 'approved') return false;
        const startDate = new Date(req.start_date);
        return startDate >= periodStart && startDate <= periodEnd;
      })
      .reduce((sum, req) => sum + req.total_days, 0);
    
    return {
      total_days: totalDays,
      used_days: usedDays,
      remaining_days: totalDays - usedDays,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0]
    };
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
    calculateFuturePeriodBalance,
    hireDate: profile?.hire_date || null,
  };
}