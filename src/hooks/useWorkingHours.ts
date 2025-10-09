import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface WorkPeriodSummary {
  totalHoursWorked: number;
  expectedHours: number;
  vacationDays: number;
  workingDays: number;
}

export function useWorkingHours(startDate: string, endDate: string) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<WorkPeriodSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && startDate && endDate) {
      calculateWorkingHours();
    }
  }, [user, startDate, endDate]);

  const calculateWorkingHours = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Obtener fichajes del período
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('total_hours')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'checked_out');

      if (timeError) throw timeError;

      // Obtener vacaciones aprobadas del período
      const { data: vacations, error: vacError } = await supabase
        .from('vacation_requests')
        .select('start_date, end_date, total_days')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .or(`and(start_date.gte.${startDate},start_date.lte.${endDate}),and(end_date.gte.${startDate},end_date.lte.${endDate})`);

      if (vacError) throw vacError;

      // Calcular total de horas trabajadas
      let totalHoursWorked = 0;
      timeEntries?.forEach(entry => {
        if (entry.total_hours) {
          const match = String(entry.total_hours).match(/(\d+):(\d+):(\d+)/);
          if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            totalHoursWorked += hours + (minutes / 60);
          }
        }
      });

      // Calcular días de vacaciones en el período (solo laborables)
      let vacationDays = 0;
      vacations?.forEach(vacation => {
        const vStart = new Date(vacation.start_date);
        const vEnd = new Date(vacation.end_date);
        const pStart = new Date(startDate);
        const pEnd = new Date(endDate);

        // Calcular solapamiento
        const overlapStart = vStart > pStart ? vStart : pStart;
        const overlapEnd = vEnd < pEnd ? vEnd : pEnd;

        if (overlapStart <= overlapEnd) {
          // Contar solo días laborables (lunes a viernes) en el período de vacaciones
          for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No sábado ni domingo
              vacationDays++;
            }
          }
        }
      });

      // Calcular días laborables en el período (lunes a viernes)
      const start = new Date(startDate);
      const end = new Date(endDate);
      let workingDays = 0;
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No sábado ni domingo
          workingDays++;
        }
      }

      // Restar días de vacaciones de los días laborables
      const effectiveWorkingDays = workingDays - vacationDays;
      const expectedHours = effectiveWorkingDays * 8; // 8 horas por día

      setSummary({
        totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
        expectedHours,
        vacationDays,
        workingDays: effectiveWorkingDays
      });
    } catch (error) {
      console.error('Error calculating working hours:', error);
    } finally {
      setLoading(false);
    }
  };

  return { summary, loading, recalculate: calculateWorkingHours };
}
