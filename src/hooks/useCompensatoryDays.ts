import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CompensatoryDay {
  id: string;
  user_id: string;
  date: string;
  reason: string;
  granted_by: string;
  created_at: string;
  updated_at: string;
}

export const useCompensatoryDays = () => {
  const [compensatoryDays, setCompensatoryDays] = useState<CompensatoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const fetchCompensatoryDays = async (userId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from("compensatory_days")
        .select("*")
        .order("date", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      } else if (profile?.role === "employee") {
        query = query.eq("user_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCompensatoryDays(data || []);
    } catch (error) {
      console.error("Error fetching compensatory days:", error);
      setCompensatoryDays([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompensatoryDays();
    }
  }, [user, profile]);

  const addCompensatoryDay = async (data: {
    user_id: string;
    date: string;
    reason: string;
  }) => {
    try {
      const { error } = await supabase.from("compensatory_days").insert({
        ...data,
        granted_by: user?.id,
      });

      if (error) throw error;
      await fetchCompensatoryDays(data.user_id);
    } catch (error) {
      console.error("Error adding compensatory day:", error);
      throw error;
    }
  };

  const deleteCompensatoryDay = async (id: string) => {
    try {
      const { error } = await supabase
        .from("compensatory_days")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchCompensatoryDays();
    } catch (error) {
      console.error("Error deleting compensatory day:", error);
      throw error;
    }
  };

  return {
    compensatoryDays,
    loading,
    addCompensatoryDay,
    deleteCompensatoryDay,
    fetchCompensatoryDays,
  };
};
