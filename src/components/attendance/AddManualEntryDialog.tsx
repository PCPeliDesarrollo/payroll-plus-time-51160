import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_SCHEDULES } from "@/components/employees/ScheduleDayRow";

interface AddManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onSuccess: () => void;
}

export function AddManualEntryDialog({ open, onOpenChange, employeeId, employeeName, onSuccess }: AddManualEntryDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkIn, setCheckIn] = useState("09:00");
  const [checkOut, setCheckOut] = useState("14:00");
  const [checkIn2, setCheckIn2] = useState("17:00");
  const [checkOut2, setCheckOut2] = useState("20:00");
  const [hasSecondShift, setHasSecondShift] = useState(true);
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !employeeId || !date) return;
    loadScheduleForDate();
  }, [open, employeeId, date]);

  const loadScheduleForDate = async () => {
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const { data } = await supabase
      .from('employee_schedules')
      .select('is_working_day, check_in_time, check_out_time, check_in_time_2, check_out_time_2')
      .eq('employee_id', employeeId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    const fallback = DEFAULT_SCHEDULES[dayOfWeek];
    const schedule = data || fallback;

    setIsWorkingDay(schedule.is_working_day);
    setCheckIn(schedule.check_in_time?.slice(0, 5) || fallback.check_in_time);
    setCheckOut(schedule.check_out_time?.slice(0, 5) || fallback.check_out_time);
    setCheckIn2(schedule.check_in_time_2?.slice(0, 5) || fallback.check_in_time_2 || "");
    setCheckOut2(schedule.check_out_time_2?.slice(0, 5) || fallback.check_out_time_2 || "");
    setHasSecondShift(Boolean(schedule.check_in_time_2 && schedule.check_out_time_2));
  };

  const buildLocalIso = (time: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute || 0, 0, 0).toISOString();
  };

  const getTotalHours = (start: string, end: string) => {
    const diffMs = new Date(buildLocalIso(end)).getTime() - new Date(buildLocalIso(start)).getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      if (!checkIn || !checkOut || checkIn >= checkOut) {
        throw new Error("Revisa las horas de entrada y salida");
      }
      if (hasSecondShift && (!checkIn2 || !checkOut2 || checkIn2 >= checkOut2)) {
        throw new Error("Revisa las horas del turno de tarde");
      }

      // Get employee's company_id
      const { data: empProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', employeeId)
        .single();

      const rows = [
        {
          user_id: employeeId,
          company_id: empProfile?.company_id,
          date,
          check_in_time: buildLocalIso(checkIn),
          check_out_time: buildLocalIso(checkOut),
          total_hours: getTotalHours(checkIn, checkOut),
          status: 'checked_out',
        },
        ...(hasSecondShift ? [{
          user_id: employeeId,
          company_id: empProfile?.company_id,
          date,
          check_in_time: buildLocalIso(checkIn2),
          check_out_time: buildLocalIso(checkOut2),
          total_hours: getTotalHours(checkIn2, checkOut2),
          status: 'checked_out',
        }] : []),
      ];

      const { error } = await supabase.from('time_entries').insert(rows as any);

      if (error) throw error;

      toast({ title: "Fichaje añadido", description: `${rows.length} fichaje${rows.length === 1 ? '' : 's'} creado${rows.length === 1 ? '' : 's'} para ${employeeName}` });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding manual entry:', error);
      toast({ title: "Error", description: error.message || "No se pudo crear el fichaje", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir fichaje manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Empleado: <strong>{employeeName}</strong></p>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {!isWorkingDay && (
            <p className="rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-warning-foreground">
              Este día está marcado como libre en el horario del empleado. Si lo guardas, será una excepción manual.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entrada mañana</Label>
              <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Salida mañana</Label>
              <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          {hasSecondShift && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entrada tarde</Label>
                <Input type="time" value={checkIn2} onChange={(e) => setCheckIn2(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Salida tarde</Label>
                <Input type="time" value={checkOut2} onChange={(e) => setCheckOut2(e.target.value)} />
              </div>
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => setHasSecondShift(prev => !prev)}>
            {hasSecondShift ? "Quitar turno de tarde" : "Añadir turno de tarde"}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
