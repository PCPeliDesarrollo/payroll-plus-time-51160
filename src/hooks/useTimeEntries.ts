import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

type TimeEntry = Database['public']['Tables']['time_entries']['Row'];

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

const GEO_TIMEOUT_MS = 8000;

const wait = (ms: number) =>
  new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('Geolocation timeout')), ms);
  });

const getCurrentPosition = (options: PositionOptions) =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const getSafeCoordinates = async (): Promise<Coordinates> => {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return { latitude: null, longitude: null };
  }

  try {
    const position = await Promise.race([
      getCurrentPosition({
        timeout: GEO_TIMEOUT_MS,
        maximumAge: 60000,
        enableHighAccuracy: true,
      }),
      wait(GEO_TIMEOUT_MS + 500),
    ]);

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (highAccuracyError) {
    console.warn('No se pudo obtener ubicación precisa, probando modo compatible:', highAccuracyError);

    try {
      const fallbackPosition = await Promise.race([
        getCurrentPosition({
          timeout: 3000,
          maximumAge: 300000,
          enableHighAccuracy: false,
        }),
        wait(3500),
      ]);

      return {
        latitude: fallbackPosition.coords.latitude,
        longitude: fallbackPosition.coords.longitude,
      };
    } catch (fallbackError) {
      console.warn('No se pudo obtener la geolocalización:', fallbackError);
      return { latitude: null, longitude: null };
    }
  }
};

export function useTimeEntries() {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);

  useEffect(() => {
    if (user) {
      fetchTimeEntries();
      fetchTodayEntry();

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
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.status === 'checked_in') {
        setCurrentEntry(data);
      } else {
        setCurrentEntry(null);
      }
    } catch (error) {
      console.error('Error fetching today entry:', error);
    }
  };

  const checkIn = async () => {
    if (!user) {
      throw new Error('Debes iniciar sesión para fichar');
    }

    const today = new Date().toISOString().split('T')[0];

    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.company_id) {
        throw new Error('No se encontró el company_id del usuario');
      }

      const { data: existingEntry, error: existingEntryError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('status', 'checked_in')
        .maybeSingle();

      if (existingEntryError && existingEntryError.code !== 'PGRST116') throw existingEntryError;
      if (existingEntry) {
        throw new Error('Ya tienes un fichaje de entrada activo. Por favor, ficha la salida');
      }

      const now = new Date().toISOString();
      const { latitude, longitude } = await getSafeCoordinates();

      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          company_id: profile.company_id,
          date: today,
          check_in_time: now,
          status: 'checked_in',
          check_in_latitude: latitude,
          check_in_longitude: longitude,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentEntry(data);
      await fetchTimeEntries();
      await fetchTodayEntry();

      return data;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkOut = async () => {
    if (!user) {
      throw new Error('Debes iniciar sesión para fichar');
    }

    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      let activeEntry = currentEntry;

      if (!activeEntry || activeEntry.status !== 'checked_in') {
        console.log('currentEntry stale, querying DB directly for active entry...');
        const { data: dbEntry, error: fetchError } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .eq('status', 'checked_in')
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (!dbEntry) {
          throw new Error('No tienes un fichaje de entrada activo');
        }
        activeEntry = dbEntry;
      }

      const now = new Date().toISOString();
      const { latitude, longitude } = await getSafeCoordinates();

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          check_out_time: now,
          status: 'checked_out',
          check_out_latitude: latitude,
          check_out_longitude: longitude,
        })
        .eq('id', activeEntry.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentEntry(null);
      await fetchTimeEntries();
      await fetchTodayEntry();

      return data;
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.company_id) {
        throw new Error('No se encontró el company_id del usuario');
      }

      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ...entry,
          user_id: user.id,
          company_id: profile.company_id,
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
