import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

interface DaySchedule {
  is_working_day: boolean;
  check_in_time: string;
  check_out_time: string;
}

const DEFAULT_SCHEDULES: Record<number, DaySchedule> = {
  1: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  2: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  3: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  4: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  5: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  6: { is_working_day: false, check_in_time: '09:00', check_out_time: '14:00' },
  0: { is_working_day: false, check_in_time: '09:00', check_out_time: '14:00' },
};

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
      // Check for employee-specific schedules
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
          };
        });
        setSchedules(map);
      } else {
        setHasCustomSchedule(false);
        // Load company schedules as default
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
      // Delete existing employee schedules
      await supabase
        .from('employee_schedules')
        .delete()
        .eq('employee_id', employeeId);

      // Insert new schedules
      const rows = DAYS_OF_WEEK.map(day => ({
        employee_id: employeeId,
        company_id: companyId,
        day_of_week: day.value,
        is_working_day: schedules[day.value].is_working_day,
        check_in_time: schedules[day.value].check_in_time,
        check_out_time: schedules[day.value].check_out_time,
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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
                <div key={day.value} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                  <div className="w-24 font-medium text-sm text-foreground">{day.label}</div>
                  <Switch
                    checked={schedules[day.value].is_working_day}
                    onCheckedChange={(checked) => updateSchedule(day.value, 'is_working_day', checked)}
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {schedules[day.value].is_working_day ? 'Laboral' : 'Libre'}
                  </span>
                  {schedules[day.value].is_working_day && (
                    <>
                      <Input
                        type="time"
                        value={schedules[day.value].check_in_time}
                        onChange={(e) => updateSchedule(day.value, 'check_in_time', e.target.value)}
                        className="w-28 h-8 text-sm"
                      />
                      <span className="text-muted-foreground text-sm">—</span>
                      <Input
                        type="time"
                        value={schedules[day.value].check_out_time}
                        onChange={(e) => updateSchedule(day.value, 'check_out_time', e.target.value)}
                        className="w-28 h-8 text-sm"
                      />
                    </>
                  )}
                </div>
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
