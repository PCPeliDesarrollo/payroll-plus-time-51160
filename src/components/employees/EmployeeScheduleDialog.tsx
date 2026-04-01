import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { ScheduleDayRow, DaySchedule, DAYS_OF_WEEK, DEFAULT_SCHEDULES } from "./ScheduleDayRow";

interface EmployeeScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  companyId: string;
}

export function EmployeeScheduleDialog({ open, onOpenChange, employeeId, employeeName, companyId }: EmployeeScheduleDialogProps) {
  const [schedules, setSchedules] = useState<Record<number, DaySchedule>>({ ...DEFAULT_SCHEDULES });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasCustomSchedule, setHasCustomSchedule] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !employeeId) return;
    loadSchedules();
  }, [open, employeeId]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const { data: empSchedules } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', employeeId);

      if (empSchedules && empSchedules.length > 0) {
        setHasCustomSchedule(true);
        const map: Record<number, DaySchedule> = { ...DEFAULT_SCHEDULES };
        empSchedules.forEach((s: any) => {
          map[s.day_of_week] = {
            is_working_day: s.is_working_day,
            check_in_time: s.check_in_time?.slice(0, 5) || '09:00',
            check_out_time: s.check_out_time?.slice(0, 5) || '17:00',
            check_in_time_2: s.check_in_time_2?.slice(0, 5) || '',
            check_out_time_2: s.check_out_time_2?.slice(0, 5) || '',
          };
        });
        setSchedules(map);
      } else {
        setHasCustomSchedule(false);
        const { data: compSchedules } = await supabase
          .from('company_schedules')
          .select('*')
          .eq('company_id', companyId);

        if (compSchedules && compSchedules.length > 0) {
          const map: Record<number, DaySchedule> = { ...DEFAULT_SCHEDULES };
          compSchedules.forEach((s: any) => {
            map[s.day_of_week] = {
              is_working_day: s.is_working_day,
              check_in_time: s.check_in_time?.slice(0, 5) || '09:00',
              check_out_time: s.check_out_time?.slice(0, 5) || '17:00',
              check_in_time_2: '',
              check_out_time_2: '',
            };
          });
          setSchedules(map);
        } else {
          setSchedules({ ...DEFAULT_SCHEDULES });
        }
      }
    } catch (err) {
      console.error('Error loading schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = (day: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedules(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('employee_schedules')
        .delete()
        .eq('employee_id', employeeId);

      const rows = DAYS_OF_WEEK.map(day => ({
        employee_id: employeeId,
        company_id: companyId,
        day_of_week: day.value,
        is_working_day: schedules[day.value].is_working_day,
        check_in_time: schedules[day.value].check_in_time,
        check_out_time: schedules[day.value].check_out_time,
        check_in_time_2: schedules[day.value].check_in_time_2 || null,
        check_out_time_2: schedules[day.value].check_out_time_2 || null,
      }));

      const { error } = await supabase
        .from('employee_schedules')
        .insert(rows);

      if (error) throw error;

      toast({ title: "Horario guardado", description: `Horario individual asignado a ${employeeName}` });
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving schedules:', err);
      toast({ title: "Error", description: err.message || "No se pudo guardar el horario", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToCompany = async () => {
    setSaving(true);
    try {
      await supabase
        .from('employee_schedules')
        .delete()
        .eq('employee_id', employeeId);

      toast({ title: "Horario restablecido", description: `${employeeName} usará el horario de la empresa` });
      setHasCustomSchedule(false);
      await loadSchedules();
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo restablecer", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horario de {employeeName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Cargando horario...</p>
        ) : (
          <div className="space-y-3">
            {hasCustomSchedule && (
              <p className="text-xs text-primary font-medium">✓ Este empleado tiene un horario individual asignado</p>
            )}
            {!hasCustomSchedule && (
              <p className="text-xs text-muted-foreground">Usando el horario de la empresa. Guarda para asignar un horario individual.</p>
            )}

            <div className="space-y-2">
              {DAYS_OF_WEEK.map(day => (
                <ScheduleDayRow
                  key={day.value}
                  dayValue={day.value}
                  dayLabel={day.label}
                  schedule={schedules[day.value]}
                  onUpdate={updateSchedule}
                />
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {hasCustomSchedule && (
            <Button variant="outline" onClick={handleResetToCompany} disabled={saving}>
              Usar horario empresa
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Guardando..." : "Guardar horario individual"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
