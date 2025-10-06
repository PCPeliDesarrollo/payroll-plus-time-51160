import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface ScheduleChange {
  id: string;
  user_id: string;
  requested_date: string;
  current_check_in: string | null;
  current_check_out: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_comments: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
    department: string | null;
  };
}

export function useScheduleChanges() {
  const { user, profile } = useAuth();
  const [scheduleChanges, setScheduleChanges] = useState<ScheduleChange[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduleChanges = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('schedule_changes')
        .select(`
          *,
          profiles!schedule_changes_user_id_fkey (
            full_name,
            email,
            department
          )
        `)
        .order('created_at', { ascending: false });

      // Si es empleado, solo ver sus propias solicitudes
      if (profile?.role === 'employee') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setScheduleChanges((data || []) as any);
    } catch (error) {
      console.error('Error fetching schedule changes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los cambios de horario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createScheduleChange = async (change: Omit<ScheduleChange, 'id' | 'created_at' | 'updated_at' | 'status' | 'approved_by' | 'approved_at' | 'admin_comments'>) => {
    try {
      const { error } = await supabase
        .from('schedule_changes')
        .insert([change]);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Solicitud de cambio enviada correctamente',
      });

      fetchScheduleChanges();
    } catch (error) {
      console.error('Error creating schedule change:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud',
        variant: 'destructive',
      });
    }
  };

  const updateScheduleChange = async (
    id: string,
    status: 'approved' | 'rejected',
    adminComments?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('schedule_changes')
        .update({
          status,
          admin_comments: adminComments,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: `Cambio ${status === 'approved' ? 'aprobado' : 'rechazado'} correctamente`,
      });

      fetchScheduleChanges();
    } catch (error) {
      console.error('Error updating schedule change:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el cambio',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchScheduleChanges();
    }
  }, [user, profile]);

  return {
    scheduleChanges,
    loading,
    createScheduleChange,
    updateScheduleChange,
    fetchScheduleChanges,
  };
}
