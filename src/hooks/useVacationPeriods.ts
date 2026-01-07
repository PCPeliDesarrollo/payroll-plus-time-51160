import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface VacationPeriod {
  id: string;
  year: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
  company_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useVacationPeriods() {
  const { user, profile } = useAuth();
  const [periods, setPeriods] = useState<VacationPeriod[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      fetchPeriods();
    }
  }, [user, profile]);

  const fetchPeriods = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vacation_periods')
        .select('*')
        .order('year', { ascending: true });

      if (error) throw error;
      setPeriods((data || []) as VacationPeriod[]);
    } catch (error) {
      console.error('Error fetching vacation periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivePeriods = () => {
    const now = new Date();
    const currentPeriodYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
    // Return current and next period (the ones users can request vacations for)
    return periods.filter(p => p.year === currentPeriodYear || p.year === currentPeriodYear + 1);
  };

  const getPeriodById = (id: string) => {
    return periods.find(p => p.id === id);
  };

  const getPeriodByYear = (year: number) => {
    return periods.find(p => p.year === year);
  };

  const formatPeriodLabel = (period: VacationPeriod) => {
    const startDate = new Date(period.period_start);
    const endDate = new Date(period.period_end);
    return `Periodo ${period.year} (${startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})`;
  };

  return {
    periods,
    loading,
    fetchPeriods,
    getActivePeriods,
    getPeriodById,
    getPeriodByYear,
    formatPeriodLabel,
  };
}
