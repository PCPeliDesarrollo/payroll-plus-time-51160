import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEmployees();
    }
  }, [user]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (employee: {
    full_name: string;
    email: string;
    role: string;
    department?: string;
    employee_id?: string;
    password: string;
  }) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Call the edge function to create the employee
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: employee
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      await fetchEmployees();
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Profile>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchEmployees();
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deactivateEmployee = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchEmployees();
      return data;
    } catch (error) {
      console.error('Error deactivating employee:', error);
      throw error;
    }
  };

  return {
    employees,
    loading,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    fetchEmployees,
  };
}
