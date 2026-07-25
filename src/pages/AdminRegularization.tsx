import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Clock } from "lucide-react";
import { EmployeeScheduleDialog } from "@/components/employees/EmployeeScheduleDialog";
import { DEFAULT_SCHEDULES } from "@/components/employees/ScheduleDayRow";

interface ScheduleDay {
  day_of_week: number;
  is_working_day: boolean;
  check_in_time: string;
  check_out_time: string;
  check_in_time_2: string;
  check_out_time_2: string;
}

interface PreviewEntry {
  key: string;
  date: string;
  check_in_time: string;
  check_out_time: string;
  check_in_label: string;
  check_out_label: string;
  hours: number;
  selected: boolean;
}

function parseTimeToHours(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
}

function localDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute || 0, 0, 0);
}

function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 3600000;
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ISO week key (Mon-Sun)
const weekKey = (d: Date) => {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+tmp - +yearStart) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${weekNo}`;
};

export function AdminRegularization() {
  const { employees } = useEmployees();
  const { toast } = useToast();
  const today = new Date();

  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [mode, setMode] = useState<"month" | "range">("month");
  const [selectedMonth, setSelectedMonth] = useState<string>(String(today.getMonth()));
  const [selectedYear, setSelectedYear] = useState<string>(String(today.getFullYear()));
  const [rangeStart, setRangeStart] = useState<string>(toDateStr(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [rangeEnd, setRangeEnd] = useState<string>(toDateStr(today));
  const [weeklyTarget, setWeeklyTarget] = useState<string>("40");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewEntry[] | null>(null);
  const [companyId, setCompanyId] = useState<string>("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const monthOptions: { year: number; month: number; label: string }[] = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthOptions.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  const resetPreview = () => setPreview(null);

  const buildPreview = async () => {
    if (!selectedEmployee) {
      toast({ title: "Error", description: "Por favor selecciona un empleado", variant: "destructive" });
      return;
    }

    const target = parseFloat(weeklyTarget);
    if (!target || target <= 0) {
      toast({ title: "Error", description: "Introduce un objetivo semanal de horas válido", variant: "destructive" });
      return;
    }

    let startDate: Date;
    let endDate: Date;
    if (mode === "month") {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
    } else {
      if (!rangeStart || !rangeEnd) {
        toast({ title: "Error", description: "Selecciona la fecha de inicio y fin", variant: "destructive" });
        return;
      }
      const [sy, sm, sd] = rangeStart.split('-').map(Number);
      const [ey, em, ed] = rangeEnd.split('-').map(Number);
      startDate = new Date(sy, sm - 1, sd);
      endDate = new Date(ey, em - 1, ed);
      if (endDate < startDate) {
        toast({ title: "Error", description: "La fecha de fin debe ser posterior a la de inicio", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    setPreview(null);
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', selectedEmployee)
        .maybeSingle();

      if (employeeError) throw employeeError;
      if (!employeeData?.company_id) {
        toast({ title: "Error", description: "El empleado no tiene una empresa asignada", variant: "destructive" });
        return;
      }
      setCompanyId(employeeData.company_id);

      const { data: empSchedules } = await supabase
        .from('employee_schedules')
        .select('day_of_week, is_working_day, check_in_time, check_out_time, check_in_time_2, check_out_time_2')
        .eq('employee_id', selectedEmployee);

      if (!empSchedules || empSchedules.length === 0) {
        toast({
          title: "Usando horario por defecto",
          description: "Este empleado no tenía horario asignado; se aplicará lunes a viernes de 09:00 a 14:00 y de 17:00 a 20:00.",
        });
      }

      const scheduleMap: Record<number, ScheduleDay> = {};
      Object.entries(DEFAULT_SCHEDULES).forEach(([day, schedule]) => {
        scheduleMap[Number(day)] = { day_of_week: Number(day), ...schedule };
      });

      empSchedules?.forEach((s: any) => {
        scheduleMap[s.day_of_week] = {
          day_of_week: s.day_of_week,
          is_working_day: s.is_working_day,
          check_in_time: s.check_in_time?.slice(0, 5) || '09:00',
          check_out_time: s.check_out_time?.slice(0, 5) || '14:00',
          check_in_time_2: s.check_in_time_2?.slice(0, 5) || '',
          check_out_time_2: s.check_out_time_2?.slice(0, 5) || '',
        };
      });

      // Fetch existing entries covering the full ISO weeks touched by the range
      const fetchFrom = new Date(startDate);
      fetchFrom.setDate(fetchFrom.getDate() - 7);
      const fetchTo = new Date(endDate);
      fetchTo.setDate(fetchTo.getDate() + 7);

      const { data: entries, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', selectedEmployee)
        .gte('date', toDateStr(fetchFrom))
        .lte('date', toDateStr(fetchTo));

      if (fetchError) throw fetchError;

      const hoursByWeek: Record<string, number> = {};
      const entriesByDate: Record<string, { start: Date; end: Date }[]> = {};

      entries?.forEach(entry => {
        if (entry.check_in_time && entry.check_out_time) {
          if (!entriesByDate[entry.date]) entriesByDate[entry.date] = [];
          entriesByDate[entry.date].push({
            start: new Date(entry.check_in_time),
            end: new Date(entry.check_out_time),
          });
        }

        if (entry.total_hours) {
          const match = entry.total_hours.toString().match(/(\d+):(\d+):(\d+)/);
          if (match) {
            const h = parseInt(match[1]) + parseInt(match[2]) / 60;
            const [yy, mm, dd] = entry.date.split('-').map(Number);
            hoursByWeek[weekKey(new Date(yy, mm - 1, dd))] = (hoursByWeek[weekKey(new Date(yy, mm - 1, dd))] || 0) + h;
          }
        }
      });

      const rows: PreviewEntry[] = [];
      const cursor = new Date(startDate);

      while (cursor <= endDate) {
        const dateStr = toDateStr(cursor);
        const dayOfWeek = cursor.getDay();

        if (cursor > today) break;

        const schedule = scheduleMap[dayOfWeek];
        if (!schedule || !schedule.is_working_day) { cursor.setDate(cursor.getDate() + 1); continue; }

        const scheduledShifts = [
          { key: '1', start: schedule.check_in_time, end: schedule.check_out_time },
          ...(schedule.check_in_time_2 && schedule.check_out_time_2
            ? [{ key: '2', start: schedule.check_in_time_2, end: schedule.check_out_time_2 }]
            : []),
        ];

        for (const shift of scheduledShifts) {
          const k = weekKey(cursor);
          const used = hoursByWeek[k] || 0;
          const remaining = target - used;
          if (remaining <= 0.01) break;

          const scheduledStart = localDateTime(dateStr, shift.start);
          const scheduledEnd = localDateTime(dateStr, shift.end);
          const scheduledHours = hoursBetween(scheduledStart, scheduledEnd);
          if (scheduledHours <= 0) continue;

          const overlapsExistingEntry = (entriesByDate[dateStr] || []).some(entry =>
            intervalsOverlap(scheduledStart, scheduledEnd, entry.start, entry.end)
          );
          if (overlapsExistingEntry) continue;

          const hoursToCreate = Math.min(scheduledHours, remaining);
          if (hoursToCreate < 0.25) continue;

          const createdEnd = new Date(scheduledStart.getTime() + hoursToCreate * 3600000);
          rows.push({
            key: `${dateStr}-${shift.key}`,
            date: dateStr,
            check_in_time: scheduledStart.toISOString(),
            check_out_time: createdEnd.toISOString(),
            check_in_label: formatLocalTime(scheduledStart),
            check_out_label: formatLocalTime(createdEnd),
            hours: hoursToCreate,
            selected: true,
          });

          hoursByWeek[k] = used + hoursToCreate;
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      if (rows.length === 0) {
        toast({ title: "Sin fichajes pendientes", description: "No hay días por regularizar en el periodo elegido: ya se alcanza el objetivo semanal o no quedan huecos en su horario" });
        return;
      }

      setPreview(rows);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Hubo un problema al calcular la regularización", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const confirmRegularization = async () => {
    if (!preview) return;
    const chosen = preview.filter(p => p.selected);
    if (chosen.length === 0) {
      toast({ title: "Nada seleccionado", description: "Marca al menos un fichaje para crear", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('time_entries').insert(
        chosen.map(p => ({
          user_id: selectedEmployee,
          company_id: companyId,
          date: p.date,
          check_in_time: p.check_in_time,
          check_out_time: p.check_out_time,
          status: 'checked_out',
        }))
      );
      if (error) throw error;

      toast({
        title: "Regularización completada",
        description: `Se han creado ${chosen.length} fichajes respetando el horario del empleado`,
      });
      setPreview(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Hubo un problema al regularizar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeEmployees = employees.filter(emp => emp.is_active);
  const selectedEmployeeRecord = activeEmployees.find(employee => employee.id === selectedEmployee);
  const totalPreviewHours = preview?.filter(p => p.selected).reduce((acc, p) => acc + p.hours, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Regularización Automática</h2>
        <p className="text-muted-foreground">Completa los fichajes faltantes de cualquier periodo usando siempre el horario individual del empleado</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Regularizar Fichajes
          </CardTitle>
          <CardDescription>
            Elige empleado, periodo y objetivo semanal. Podrás revisar los fichajes antes de crearlos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employee">Empleado</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={selectedEmployee} onValueChange={(v) => { setSelectedEmployee(v); resetPreview(); }}>
                <SelectTrigger id="employee" className="flex-1">
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} - {employee.employee_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setScheduleDialogOpen(true)}
                disabled={!selectedEmployeeRecord}
              >
                Editar horario
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Periodo</Label>
            <Select value={mode} onValueChange={(v) => { setMode(v as "month" | "range"); resetPreview(); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mes completo</SelectItem>
                <SelectItem value="range">Rango de fechas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "month" ? (
            <div className="space-y-2">
              <Label>Mes a regularizar</Label>
              <Select
                value={`${selectedYear}-${selectedMonth}`}
                onValueChange={(v) => {
                  const [y, m] = v.split('-');
                  setSelectedYear(y);
                  setSelectedMonth(m);
                  resetPreview();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="range-start">Desde</Label>
                <Input id="range-start" type="date" value={rangeStart} onChange={(e) => { setRangeStart(e.target.value); resetPreview(); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="range-end">Hasta</Label>
                <Input id="range-end" type="date" value={rangeEnd} onChange={(e) => { setRangeEnd(e.target.value); resetPreview(); }} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="weekly-target">Objetivo de horas semanales</Label>
            <Input
              id="weekly-target"
              type="number"
              min="1"
              max="60"
              step="0.5"
              value={weeklyTarget}
              onChange={(e) => { setWeeklyTarget(e.target.value); resetPreview(); }}
            />
            <p className="text-xs text-muted-foreground">Nunca se superará este total por semana (contando los fichajes que ya existan).</p>
          </div>

          <Button
            onClick={buildPreview}
            disabled={loading || !selectedEmployee}
            className="w-full"
          >
            {loading ? "Calculando..." : "Previsualizar regularización"}
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fichajes a crear</CardTitle>
            <CardDescription>
              {preview.filter(p => p.selected).length} de {preview.length} seleccionados · {totalPreviewHours.toFixed(2)} h en total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {preview.map((row, idx) => (
                <label
                  key={row.key}
                  className="flex items-center gap-3 rounded-md border border-border p-3 text-sm"
                >
                  <Checkbox
                    checked={row.selected}
                    onCheckedChange={(checked) => {
                      setPreview(prev => prev!.map((p, i) => i === idx ? { ...p, selected: checked === true } : p));
                    }}
                  />
                  <span className="font-medium">{row.date}</span>
                  <span className="text-muted-foreground">
                    {row.check_in_label} – {row.check_out_label}
                  </span>
                  <span className="ml-auto text-muted-foreground">{row.hours.toFixed(2)} h</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPreview(null)} disabled={loading}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={confirmRegularization} disabled={loading}>
                {loading ? "Creando..." : "Crear fichajes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-primary" />
            Cómo funciona la regularización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">1.</span>
            <span>Puedes regularizar un mes completo (hasta 24 meses atrás) o un rango concreto de fechas</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <span>Usa siempre el horario individual del empleado: entradas y salidas exactas, incluyendo turnos partidos</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>Solo crea fichajes en días laborables de su horario, nunca en días libres ni días ya fichados</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>Respeta el objetivo semanal indicado, descontando las horas que el empleado ya tenga registradas esa semana</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">5.</span>
            <span>Antes de crear nada verás la lista completa y podrás desmarcar los días que no quieras</span>
          </p>
        </CardContent>
      </Card>

      {selectedEmployeeRecord && (
        <EmployeeScheduleDialog
          open={scheduleDialogOpen}
          onOpenChange={(open) => {
            setScheduleDialogOpen(open);
            if (!open) resetPreview();
          }}
          employeeId={selectedEmployeeRecord.id}
          employeeName={selectedEmployeeRecord.full_name}
          companyId={selectedEmployeeRecord.company_id || ''}
        />
      )}
    </div>
  );
}
