import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las empresas',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const createCompany = async (company: CompanyInsert) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => [data, ...prev]);
      toast({
        title: 'Empresa creada',
        description: 'La empresa ha sido creada exitosamente',
      });
      return data;
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear la empresa',
      });
      throw error;
    }
  };

  const updateCompany = async (id: string, updates: CompanyUpdate) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: 'Empresa actualizada',
        description: 'La empresa ha sido actualizada exitosamente',
      });
      return data;
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la empresa',
      });
      throw error;
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompanies(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Empresa eliminada',
        description: 'La empresa ha sido eliminada exitosamente',
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la empresa',
      });
      throw error;
    }
  };

  const toggleCompanyStatus = async (id: string, isActive: boolean) => {
    return updateCompany(id, { is_active: isActive });
  };

  return {
    companies,
    loading,
    createCompany,
    updateCompany,
    deleteCompany,
    toggleCompanyStatus,
    refetch: fetchCompanies,
  };
}