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
      // Obtener el company_id del admin que está creando el empleado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.company_id) {
        throw new Error('No se encontró el company_id del administrador');
      }

      // Call the edge function to create the employee
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: {
          ...employee,
          company_id: profile.company_id
        }
      });

      console.log('Respuesta de la edge function:', { data, error });

      if (error) {
        console.error('Error en edge function:', error);
        throw new Error(error.message || 'Error al comunicarse con el servidor');
      }
      
      // Ahora la edge function siempre devuelve 200, pero con success: false si hay error
      if (!data || data.success === false) {
        const errorMsg = data?.error || 'Error desconocido al crear el empleado';
        console.error('Error en la creación:', errorMsg);
        
        // Manejar errores específicos
        if (errorMsg.includes('duplicate') || errorMsg.includes('already exists') || errorMsg.includes('ya existe')) {
          if (errorMsg.includes('employee_id') || errorMsg.includes('ID')) {
            throw new Error('El ID de empleado ya existe. Usa un ID diferente.');
          }
          if (errorMsg.includes('email') || errorMsg.includes('correo')) {
            throw new Error('El email ya está registrado. Usa un email diferente.');
          }
        }
        throw new Error(errorMsg);
      }

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

  const deleteEmployee = async (id: string) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Llamar a la edge function para eliminar el empleado completamente
      const { data, error } = await supabase.functions.invoke('delete-employee', {
        body: { employee_id: id }
      });

      console.log('Respuesta de delete-employee:', { data, error });

      if (error) {
        console.error('Error en edge function:', error);
        throw new Error(error.message || 'Error al eliminar el empleado');
      }

      if (!data || data.success === false) {
        const errorMsg = data?.error || 'Error desconocido al eliminar el empleado';
        throw new Error(errorMsg);
      }

      await fetchEmployees();
      return data;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  };

  return {
    employees,
    loading,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    deleteEmployee,
    fetchEmployees,
  };
}
