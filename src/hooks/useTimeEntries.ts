import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

type TimeEntry = Database['public']['Tables']['time_entries']['Row'];

export function useTimeEntries() {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    if (user) {
      fetchTimeEntries();
      fetchTodayEntry();
      
      // Set up interval to refresh today's entry every 30 seconds
      const intervalId = setInterval(() => {
        fetchTodayEntry();
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const fetchTimeEntries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayEntry = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentEntry(data);
    } catch (error) {
      console.error('Error fetching today entry:', error);
    }
  };

  const checkIn = async () => {
    if (!user) {
      throw new Error('Debes iniciar sesión para fichar');
    }

    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Check if there's already an entry for today
      const { data: existingEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      // Prevent double check-in or re-entry after complete day
      if (existingEntry) {
        throw new Error('Ya tienes un fichaje para hoy. Para fichar salida, usa el botón de Fichar Salida');
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          date: today,
          check_in_time: now,
          status: 'checked_in'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update state immediately
      setCurrentEntry(data);
      
      // Fetch all entries to update the list
      await fetchTimeEntries();
      
      // Force refresh today's entry
      await fetchTodayEntry();
      
      return data;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  };

  const checkOut = async () => {
    if (!user) {
      throw new Error('Debes iniciar sesión para fichar');
    }
    
    if (!currentEntry || currentEntry.status !== 'checked_in') {
      throw new Error('No tienes un fichaje de entrada activo');
    }

    const now = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          check_out_time: now,
          status: 'checked_out'
        })
        .eq('id', currentEntry.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update state immediately
      setCurrentEntry(data);
      
      // Fetch all entries
      await fetchTimeEntries();
      
      // Force refresh today's entry
      await fetchTodayEntry();
      
      return data;
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  };

  const addTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ...entry,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchTimeEntries();
      return data;
    } catch (error) {
      console.error('Error adding time entry:', error);
      throw error;
    }
  };

  const updateTimeEntry = async (id: string, updates: Partial<TimeEntry>) => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchTimeEntries();
      return data;
    } catch (error) {
      console.error('Error updating time entry:', error);
      throw error;
    }
  };

  const deleteTimeEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error deleting time entry:', error);
      throw error;
    }
  };

  const isCheckedIn = currentEntry?.status === 'checked_in';

  return {
    timeEntries,
    currentEntry,
    loading,
    isCheckedIn,
    checkIn,
    checkOut,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    fetchTimeEntries,
  };
}