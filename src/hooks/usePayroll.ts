import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

type PayrollRecord = Database['public']['Tables']['payroll_records']['Row'];

export function usePayroll() {
  const { user, profile } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      fetchPayrollRecords();
    }
  }, [user, profile]);

  const fetchPayrollRecords = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase.from('payroll_records').select('*');
      
      // If employee, only show their records
      if (profile?.role === 'employee') {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query.order('year', { ascending: false })
                                      .order('month', { ascending: false });

      if (error) throw error;
      setPayrollRecords(data || []);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPayrollRecord = async (record: Omit<PayrollRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .insert({
          ...record,
          created_by: user.id,
          company_id: profile?.company_id,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchPayrollRecords();
      return data;
    } catch (error) {
      console.error('Error creating payroll record:', error);
      throw error;
    }
  };

  const updatePayrollRecord = async (id: string, updates: Partial<PayrollRecord>) => {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchPayrollRecords();
      return data;
    } catch (error) {
      console.error('Error updating payroll record:', error);
      throw error;
    }
  };

  const deletePayrollRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPayrollRecords();
    } catch (error) {
      console.error('Error deleting payroll record:', error);
      throw error;
    }
  };

  const uploadPayrollFile = async (file: File, recordId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${recordId}.${fileExt}`;
      const filePath = `payroll/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payroll-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('payroll-files')
        .getPublicUrl(filePath);

      await updatePayrollRecord(recordId, { file_url: data.publicUrl });
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading payroll file:', error);
      throw error;
    }
  };

  return {
    payrollRecords,
    loading,
    createPayrollRecord,
    updatePayrollRecord,
    deletePayrollRecord,
    uploadPayrollFile,
    fetchPayrollRecords,
  };
}