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

interface CompensatoryDay {
  id: string;
  user_id: string;
  days_count: number;
  reason: string;
}

export const useExtraHours = () => {
  const [extraHours, setExtraHours] = useState<ExtraHour[]>([]);
  const [extraHoursRequests, setExtraHoursRequests] = useState<ExtraHoursRequest[]>([]);
  const [compensatoryDaysHours, setCompensatoryDaysHours] = useState(0); // Hours from compensatory days (1 day = 8 hours)
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined); // Track which user we're viewing
  const { user, profile } = useAuth();

  // Calcular el balance de horas: horas ganadas + días compensatorios (x8) - horas usadas (aprobadas)
  const calculateBalance = () => {
    const totalEarned = extraHours.reduce((sum, h) => sum + Number(h.hours), 0);
    const totalFromCompensatory = compensatoryDaysHours;
    const totalAvailable = totalEarned + totalFromCompensatory;
    const totalUsed = extraHoursRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + Number(r.hours_requested), 0);
    return {
      earned: totalAvailable,
      used: totalUsed,
      available: totalAvailable - totalUsed,
      // Helper for displaying equivalent days
      earnedDays: Math.floor(totalAvailable / 8),
      availableDays: Math.floor((totalAvailable - totalUsed) / 8)
    };
  };

  const fetchExtraHours = async (userId?: string) => {
    try {
      setLoading(true);
      // If userId is provided, use it. Otherwise use stored userId or default logic
      const targetUserId = userId || currentUserId || (profile?.role === "employee" ? user?.id : undefined);
      
      // Store the userId we're fetching for (for subsequent refresh calls)
      if (userId) {
        setCurrentUserId(userId);
      }
      
      // Fetch extra hours earned
      let hoursQuery = supabase
        .from("extra_hours")
        .select("*")
        .order("date", { ascending: false });

      if (targetUserId) {
        hoursQuery = hoursQuery.eq("user_id", targetUserId);
      }

      const { data: hoursData, error: hoursError } = await hoursQuery;
      if (hoursError) throw hoursError;
      
      // Fetch extra hours requests
      let requestsQuery = supabase
        .from("extra_hours_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (targetUserId) {
        requestsQuery = requestsQuery.eq("user_id", targetUserId);
      }

      const { data: requestsData, error: requestsError } = await requestsQuery;
      if (requestsError) throw requestsError;

      // Fetch compensatory days and convert to hours (1 day = 8 hours)
      let compensatoryQuery = supabase
        .from("compensatory_days")
        .select("id, user_id, days_count, reason");

      if (targetUserId) {
        compensatoryQuery = compensatoryQuery.eq("user_id", targetUserId);
      }

      const { data: compensatoryData, error: compensatoryError } = await compensatoryQuery;
      if (compensatoryError) throw compensatoryError;

      // Calculate total hours from compensatory days
      const totalCompensatoryHours = (compensatoryData || []).reduce(
        (sum, day) => sum + (day.days_count * 8),
        0
      );

      setExtraHours(hoursData || []);
      setExtraHoursRequests(requestsData || []);
      setCompensatoryDaysHours(totalCompensatoryHours);
    } catch (error) {
      console.error("Error fetching extra hours:", error);
      setExtraHours([]);
      setExtraHoursRequests([]);
      setCompensatoryDaysHours(0);
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
