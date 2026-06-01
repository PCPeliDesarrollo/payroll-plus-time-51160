import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Clock } from "lucide-react";

interface ScheduleDay {
  day_of_week: number;
  is_working_day: boolean;
  check_in_time: string;
  check_out_time: string;
  check_in_time_2: string;
  check_out_time_2: string;
}

function parseTimeToHours(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function AdminRegularization() {
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(today.getMonth()));
  const [selectedYear, setSelectedYear] = useState<string>(String(today.getFullYear()));
  const [loading, setLoading] = useState(false);

  // Build last 24 months as options (current + previous)
  const monthOptions: { year: number; month: number; label: string }[] = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthOptions.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  const handleAutoRegularize = async () => {
    if (!selectedEmployee) {
      toast({ title: "Error", description: "Por favor selecciona un empleado", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);

      const { data: employeeData, error: employeeError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', selectedEmployee)
        .maybeSingle();

      if (employeeError) throw employeeError;
      if (!employeeData?.company_id) {
        toast({ title: "Error", description: "El empleado no tiene una empresa asignada", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data: empSchedules } = await supabase
        .from('employee_schedules')
        .select('day_of_week, is_working_day, check_in_time, check_out_time, check_in_time_2, check_out_time_2')
        .eq('employee_id', selectedEmployee);

      const scheduleMap: Record<number, ScheduleDay> = {};

      if (empSchedules && empSchedules.length > 0) {
        empSchedules.forEach((s: any) => {
          scheduleMap[s.day_of_week] = {
            day_of_week: s.day_of_week,
            is_working_day: s.is_working_day,
            check_in_time: s.check_in_time?.slice(0, 5) || '09:00',
            check_out_time: s.check_out_time?.slice(0, 5) || '17:00',
            check_in_time_2: s.check_in_time_2?.slice(0, 5) || '',
            check_out_time_2: s.check_out_time_2?.slice(0, 5) || '',
          };
        });
      } else {
        toast({
          title: "Sin horario configurado",
          description: "Este empleado no tiene un horario asignado. Configúralo primero desde la sección de Empleados.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Target monthly hours from schedule
      let targetWeeklyHours = 0;
      for (const day of Object.values(scheduleMap)) {
        if (day.is_working_day) {
          targetWeeklyHours += parseTimeToHours(day.check_out_time) - parseTimeToHours(day.check_in_time);
          if (day.check_in_time_2 && day.check_out_time_2) {
            targetWeeklyHours += parseTimeToHours(day.check_out_time_2) - parseTimeToHours(day.check_in_time_2);
          }
        }
      }
      const targetMonthlyHours = targetWeeklyHours * 4;

      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      const { data: entries, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', selectedEmployee)
        .gte('date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('date', lastDayOfMonth.toISOString().split('T')[0]);

      if (fetchError) throw fetchError;

      let totalHours = 0;
      const existingDates = new Set<string>();

      entries?.forEach(entry => {
        existingDates.add(entry.date);
        if (entry.total_hours) {
          const timeStr = entry.total_hours.toString();
          const match = timeStr.match(/(\d+):(\d+):(\d+)/);
          if (match) {
            totalHours += parseInt(match[1]) + parseInt(match[2]) / 60;
          }
        }
      });

      const remainingHours = targetMonthlyHours - totalHours;

      if (remainingHours <= 0) {
        toast({ title: "Sin fichajes pendientes", description: `Este empleado ya tiene ${targetMonthlyHours}h o más en ${MONTHS_ES[month]} ${year}` });
        setLoading(false);
        return;
      }

      // Build available slots from schedule — always use full schedule shifts
      const daysInMonth = lastDayOfMonth.getDate();
      const isCurrentOrFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth());

      const availableSlots: { date: string; schedule: ScheduleDay; hours: number }[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = date.getDay();

        // For current/future month, skip future days
        if (isCurrentOrFutureMonth && date > today) continue;
        if (existingDates.has(dateStr)) continue;

        const schedule = scheduleMap[dayOfWeek];
        if (!schedule || !schedule.is_working_day) continue;

        let hours = parseTimeToHours(schedule.check_out_time) - parseTimeToHours(schedule.check_in_time);
        if (schedule.check_in_time_2 && schedule.check_out_time_2) {
          hours += parseTimeToHours(schedule.check_out_time_2) - parseTimeToHours(schedule.check_in_time_2);
        }
        if (hours > 0) {
          availableSlots.push({ date: dateStr, schedule, hours });
        }
      }

      // Create full-shift entries until remaining hours covered (no partial / no fractional times)
      const newEntries: Array<{
        user_id: string;
        company_id: string;
        date: string;
        check_in_time: string;
        check_out_time: string;
        status: string;
      }> = [];

      let hoursToCreate = remainingHours;
      for (const slot of availableSlots) {
        if (hoursToCreate <= 0) break;

        // First shift
        newEntries.push({
          user_id: selectedEmployee,
          company_id: employeeData.company_id,
          date: slot.date,
          check_in_time: `${slot.date}T${slot.schedule.check_in_time}:00`,
          check_out_time: `${slot.date}T${slot.schedule.check_out_time}:00`,
          status: 'checked_out',
        });

        // Second shift (split shift) — separate entry on same date if present
        if (slot.schedule.check_in_time_2 && slot.schedule.check_out_time_2) {
          newEntries.push({
            user_id: selectedEmployee,
            company_id: employeeData.company_id,
            date: slot.date,
            check_in_time: `${slot.date}T${slot.schedule.check_in_time_2}:00`,
            check_out_time: `${slot.date}T${slot.schedule.check_out_time_2}:00`,
            status: 'checked_out',
          });
        }

        hoursToCreate -= slot.hours;
      }

      if (newEntries.length === 0) {
        toast({ title: "Sin días disponibles", description: "No hay días laborables disponibles para regularizar en este mes" });
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('time_entries')
        .insert(newEntries);

      if (insertError) throw insertError;

      toast({
        title: "Regularización completada",
        description: `Se han creado ${newEntries.length} fichajes en ${MONTHS_ES[month]} ${year} respetando el horario del empleado`,
      });

      setSelectedEmployee("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Hubo un problema al regularizar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeEmployees = employees.filter(emp => emp.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Regularización Automática</h2>
        <p className="text-muted-foreground">Completa los fichajes faltantes de cualquier mes usando siempre el horario individual del empleado</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Regularizar Fichajes
          </CardTitle>
          <CardDescription>
            Selecciona el empleado y el mes a regularizar. Los fichajes creados respetarán exactamente su horario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employee">Empleado</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee">
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
          </div>

          <div className="space-y-2">
            <Label>Mes a regularizar</Label>
            <Select
              value={`${selectedYear}-${selectedMonth}`}
              onValueChange={(v) => {
                const [y, m] = v.split('-');
                setSelectedYear(y);
                setSelectedMonth(m);
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

          <Button
            onClick={handleAutoRegularize}
            disabled={loading || !selectedEmployee}
            className="w-full"
          >
            {loading ? "Procesando..." : "Regularizar Automáticamente"}
          </Button>
        </CardContent>
      </Card>

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
            <span>Puedes regularizar el mes actual o cualquier mes anterior (hasta 24 meses atrás)</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <span>Usa siempre el horario individual del empleado: entradas y salidas exactas, incluyendo turnos partidos</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>Crea fichajes completos solo en días laborables del horario, nunca en días libres ni días ya fichados</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>Los fichajes generados siempre coinciden con las horas de trabajo definidas — no se crean horarios fuera de su jornada</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
