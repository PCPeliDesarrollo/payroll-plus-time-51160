import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ExtraHour {
  id: string;
  user_id: string;
  company_id: string | null;
  hours: number;
  date: string;
  reason: string;
  granted_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExtraHoursRequest {
  id: string;
  user_id: string;
  company_id: string | null;
  hours_requested: number;
  requested_date: string;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  admin_comments: string | null;
  created_at: string;
  updated_at: string;
}

export const useExtraHours = () => {
  const [extraHours, setExtraHours] = useState<ExtraHour[]>([]);
  const [extraHoursRequests, setExtraHoursRequests] = useState<ExtraHoursRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  // Calcular el balance de horas: horas ganadas - horas usadas (aprobadas)
  const calculateBalance = () => {
    const totalEarned = extraHours.reduce((sum, h) => sum + Number(h.hours), 0);
    const totalUsed = extraHoursRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + Number(r.hours_requested), 0);
    return {
      earned: totalEarned,
      used: totalUsed,
      available: totalEarned - totalUsed
    };
  };

  const fetchExtraHours = async (userId?: string) => {
    try {
      setLoading(true);
      
      // Fetch extra hours earned
      let hoursQuery = supabase
        .from("extra_hours")
        .select("*")
        .order("date", { ascending: false });

      if (userId) {
        hoursQuery = hoursQuery.eq("user_id", userId);
      } else if (profile?.role === "employee") {
        hoursQuery = hoursQuery.eq("user_id", user?.id);
      }

      const { data: hoursData, error: hoursError } = await hoursQuery;
      if (hoursError) throw hoursError;
      
      // Fetch extra hours requests
      let requestsQuery = supabase
        .from("extra_hours_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        requestsQuery = requestsQuery.eq("user_id", userId);
      } else if (profile?.role === "employee") {
        requestsQuery = requestsQuery.eq("user_id", user?.id);
      }

      const { data: requestsData, error: requestsError } = await requestsQuery;
      if (requestsError) throw requestsError;

      setExtraHours(hoursData || []);
      setExtraHoursRequests(requestsData || []);
    } catch (error) {
      console.error("Error fetching extra hours:", error);
      setExtraHours([]);
      setExtraHoursRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExtraHours();
    }
  }, [user, profile]);

  // Admin: añadir horas extra a un empleado
  const addExtraHours = async (data: {
    user_id: string;
    hours: number;
    date: string;
    reason: string;
  }) => {
    try {
      const { error } = await supabase.from("extra_hours").insert({
        user_id: data.user_id,
        hours: data.hours,
        date: data.date,
        reason: data.reason,
        granted_by: user?.id,
        company_id: profile?.company_id,
      });

      if (error) throw error;
      await fetchExtraHours(data.user_id);
    } catch (error) {
      console.error("Error adding extra hours:", error);
      throw error;
    }
  };

  // Admin: eliminar horas extra
  const deleteExtraHours = async (id: string) => {
    try {
      const { error } = await supabase
        .from("extra_hours")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchExtraHours();
    } catch (error) {
      console.error("Error deleting extra hours:", error);
      throw error;
    }
  };

  // Empleado: solicitar usar horas extra
  const requestExtraHours = async (data: {
    hours_requested: number;
    requested_date: string;
    reason?: string;
  }) => {
    try {
      const { error } = await supabase.from("extra_hours_requests").insert({
        user_id: user?.id,
        hours_requested: data.hours_requested,
        requested_date: data.requested_date,
        reason: data.reason || null,
        company_id: profile?.company_id,
      });

      if (error) throw error;
      await fetchExtraHours();
    } catch (error) {
      console.error("Error requesting extra hours:", error);
      throw error;
    }
  };

  // Admin: aprobar solicitud
  const approveExtraHoursRequest = async (id: string, comments?: string) => {
    try {
      const { error } = await supabase
        .from("extra_hours_requests")
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          admin_comments: comments || null,
        })
        .eq("id", id);

      if (error) throw error;
      await fetchExtraHours();
    } catch (error) {
      console.error("Error approving extra hours request:", error);
      throw error;
    }
  };

  // Admin: rechazar solicitud
  const rejectExtraHoursRequest = async (id: string, comments?: string) => {
    try {
      const { error } = await supabase
        .from("extra_hours_requests")
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          admin_comments: comments || null,
        })
        .eq("id", id);

      if (error) throw error;
      await fetchExtraHours();
    } catch (error) {
      console.error("Error rejecting extra hours request:", error);
      throw error;
    }
  };

  // Admin: eliminar solicitud
  const deleteExtraHoursRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("extra_hours_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchExtraHours();
    } catch (error) {
      console.error("Error deleting extra hours request:", error);
      throw error;
    }
  };

  return {
    extraHours,
    extraHoursRequests,
    loading,
    balance: calculateBalance(),
    addExtraHours,
    deleteExtraHours,
    requestExtraHours,
    approveExtraHoursRequest,
    rejectExtraHoursRequest,
    deleteExtraHoursRequest,
    fetchExtraHours,
  };
};
