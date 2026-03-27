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
}

function parseTimeToHours(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
}

function buildCheckInOut(dateStr: string, checkIn: string, checkOut: string) {
  return {
    check_in_time: `${dateStr}T${checkIn}:00`,
    check_out_time: `${dateStr}T${checkOut}:00`,
  };
}

export function AdminRegularization() {
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleAutoRegularize = async () => {
    if (!selectedEmployee) {
      toast({ title: "Error", description: "Por favor selecciona un empleado", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Get employee's company_id
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

      // First try employee-specific schedules, fallback to company schedules
      const { data: empSchedules } = await supabase
        .from('employee_schedules')
        .select('day_of_week, is_working_day, check_in_time, check_out_time')
        .eq('employee_id', selectedEmployee);

      let scheduleMap: Record<number, ScheduleDay> = {};

      if (empSchedules && empSchedules.length > 0) {
        empSchedules.forEach((s: any) => {
          scheduleMap[s.day_of_week] = {
            day_of_week: s.day_of_week,
            is_working_day: s.is_working_day,
            check_in_time: s.check_in_time?.slice(0, 5) || '09:00',
            check_out_time: s.check_out_time?.slice(0, 5) || '17:00',
          };
        });
      } else {
        // Fallback to company schedules
        const { data: compSchedules } = await supabase
          .from('company_schedules')
          .select('day_of_week, is_working_day, check_in_time, check_out_time')
          .eq('company_id', employeeData.company_id);

        if (compSchedules && compSchedules.length > 0) {
          compSchedules.forEach((s: any) => {
            scheduleMap[s.day_of_week] = {
              day_of_week: s.day_of_week,
              is_working_day: s.is_working_day,
              check_in_time: s.check_in_time?.slice(0, 5) || '09:00',
              check_out_time: s.check_out_time?.slice(0, 5) || '17:00',
            };
          });
        } else {
          // Default: Mon-Fri 9-17, Sat-Sun off
          for (let d = 1; d <= 5; d++) {
            scheduleMap[d] = { day_of_week: d, is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' };
          }
          scheduleMap[6] = { day_of_week: 6, is_working_day: false, check_in_time: '09:00', check_out_time: '14:00' };
          scheduleMap[0] = { day_of_week: 0, is_working_day: false, check_in_time: '09:00', check_out_time: '14:00' };
        }
      }

      // Calculate target hours from schedule
      let targetWeeklyHours = 0;
      for (const day of Object.values(scheduleMap)) {
        if (day.is_working_day) {
          targetWeeklyHours += parseTimeToHours(day.check_out_time) - parseTimeToHours(day.check_in_time);
        }
      }
      const targetMonthlyHours = targetWeeklyHours * 4; // ~4 weeks

      // Get current month's entries
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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
        toast({ title: "Sin fichajes pendientes", description: `Este empleado ya tiene ${targetMonthlyHours}h o más este mes` });
        setLoading(false);
        return;
      }

      // Build available slots from schedule
      const daysInMonth = lastDayOfMonth.getDate();
      const availableSlots: { date: string; checkIn: string; checkOut: string; hours: number }[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

        if (date > now || existingDates.has(dateStr)) continue;

        const schedule = scheduleMap[dayOfWeek];
        if (!schedule || !schedule.is_working_day) continue;

        const hours = parseTimeToHours(schedule.check_out_time) - parseTimeToHours(schedule.check_in_time);
        if (hours > 0) {
          availableSlots.push({
            date: dateStr,
            checkIn: schedule.check_in_time,
            checkOut: schedule.check_out_time,
            hours,
          });
        }
      }

      // Create entries until we fill remaining hours
      let hoursToCreate = remainingHours;
      const newEntries: Array<{
        user_id: string;
        company_id: string;
        date: string;
        check_in_time: string;
        check_out_time: string;
        status: string;
      }> = [];

      for (const slot of availableSlots) {
        if (hoursToCreate <= 0) break;

        const hoursForEntry = Math.min(slot.hours, hoursToCreate);
        const { check_in_time, check_out_time } = buildCheckInOut(slot.date, slot.checkIn, slot.checkOut);

        // If we need fewer hours than the slot, adjust checkout
        let finalCheckOut = check_out_time;
        if (hoursForEntry < slot.hours) {
          const inHours = parseTimeToHours(slot.checkIn);
          const endHour = inHours + hoursForEntry;
          const h = Math.floor(endHour);
          const m = Math.round((endHour - h) * 60);
          finalCheckOut = `${slot.date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
        }

        newEntries.push({
          user_id: selectedEmployee,
          company_id: employeeData.company_id,
          date: slot.date,
          check_in_time,
          check_out_time: finalCheckOut,
          status: 'checked_out',
        });

        hoursToCreate -= hoursForEntry;
      }

      if (newEntries.length === 0) {
        toast({ title: "Sin días disponibles", description: "No hay días laborables disponibles para regularizar este mes" });
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('time_entries')
        .insert(newEntries);

      if (insertError) throw insertError;

      toast({
        title: "Regularización completada",
        description: `Se han creado ${newEntries.length} fichajes (${(targetMonthlyHours - (targetMonthlyHours - remainingHours + (remainingHours - hoursToCreate))).toFixed(1)}h → ${remainingHours.toFixed(1)}h restantes cubiertas)`,
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
        <p className="text-muted-foreground">Completa automáticamente los fichajes faltantes según el horario asignado</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Regularizar Fichajes
          </CardTitle>
          <CardDescription>
            Selecciona un empleado para completar sus fichajes del mes actual según su horario
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
            <span>Usa el horario individual del empleado, o el horario de la empresa si no tiene uno asignado</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <span>Calcula las horas faltantes para cubrir las horas mensuales según el horario configurado</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>Solo crea fichajes en los días marcados como laborables y dentro del horario configurado</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>Nunca crea fichajes en días libres, días futuros ni días con fichajes existentes</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
