import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Clock } from "lucide-react";

export function AdminRegularization() {
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleAutoRegularize = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Por favor selecciona un empleado",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: "El empleado no tiene una empresa asignada",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get current month's entries for the selected employee
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

      // Calculate total hours worked
      let totalHours = 0;
      const existingDates = new Set<string>();
      
      entries?.forEach(entry => {
        existingDates.add(entry.date);
        if (entry.total_hours) {
          const timeStr = entry.total_hours.toString();
          const match = timeStr.match(/(\d+):(\d+):(\d+)/);
          if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            totalHours += hours + (minutes / 60);
          }
        }
      });

      // Calculate remaining hours needed (40 hours per week = 160 hours per month)
      const targetHours = 160;
      const remainingHours = targetHours - totalHours;

      if (remainingHours <= 0) {
        toast({
          title: "Sin fichajes pendientes",
          description: "Este empleado ya tiene 160 horas o más este mes",
        });
        setLoading(false);
        return;
      }

      // Get all days of the month that are valid work days
      const daysInMonth = lastDayOfMonth.getDate();
      const availableSlots: { date: string; type: 'weekday_morning' | 'weekday_afternoon' | 'saturday'; hours: number }[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Skip if date is in the future or already has entries
        if (date > now || existingDates.has(dateStr)) continue;
        
        // Skip Sunday (day 0) - NO work on Sundays
        if (dayOfWeek === 0) continue;
        
        // Saturday: 11:00-14:00 (3 hours)
        if (dayOfWeek === 6) {
          availableSlots.push({ date: dateStr, type: 'saturday', hours: 3 });
        } else {
          // Monday to Friday: Morning 9:00-14:00 (5h) + Afternoon 17:00-20:00 (3h)
          availableSlots.push({ date: dateStr, type: 'weekday_morning', hours: 5 });
          availableSlots.push({ date: dateStr, type: 'weekday_afternoon', hours: 3 });
        }
      }

      // Sort slots: weekdays first (morning then afternoon), then Saturdays
      availableSlots.sort((a, b) => {
        if (a.type === 'saturday' && b.type !== 'saturday') return 1;
        if (a.type !== 'saturday' && b.type === 'saturday') return -1;
        return a.date.localeCompare(b.date);
      });

      // Create entries until we reach remaining hours
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

        let checkIn: string;
        let checkOut: string;
        let hoursForThisEntry: number;

        if (slot.type === 'weekday_morning') {
          // Turno mañana: 9:00 - 14:00 (5 horas)
          checkIn = `${slot.date}T09:00:00`;
          checkOut = `${slot.date}T14:00:00`;
          hoursForThisEntry = Math.min(5, hoursToCreate);
          // Adjust checkout if we need less than 5 hours
          if (hoursForThisEntry < 5) {
            const endHour = 9 + Math.floor(hoursForThisEntry);
            const endMinutes = Math.round((hoursForThisEntry - Math.floor(hoursForThisEntry)) * 60);
            checkOut = `${slot.date}T${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
          }
        } else if (slot.type === 'weekday_afternoon') {
          // Turno tarde: 17:00 - 20:00 (3 horas)
          checkIn = `${slot.date}T17:00:00`;
          checkOut = `${slot.date}T20:00:00`;
          hoursForThisEntry = Math.min(3, hoursToCreate);
          if (hoursForThisEntry < 3) {
            const endHour = 17 + Math.floor(hoursForThisEntry);
            const endMinutes = Math.round((hoursForThisEntry - Math.floor(hoursForThisEntry)) * 60);
            checkOut = `${slot.date}T${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
          }
        } else {
          // Sábado: 11:00 - 14:00 (3 horas)
          checkIn = `${slot.date}T11:00:00`;
          checkOut = `${slot.date}T14:00:00`;
          hoursForThisEntry = Math.min(3, hoursToCreate);
          if (hoursForThisEntry < 3) {
            const endHour = 11 + Math.floor(hoursForThisEntry);
            const endMinutes = Math.round((hoursForThisEntry - Math.floor(hoursForThisEntry)) * 60);
            checkOut = `${slot.date}T${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;
          }
        }

        newEntries.push({
          user_id: selectedEmployee,
          company_id: employeeData.company_id,
          date: slot.date,
          check_in_time: checkIn,
          check_out_time: checkOut,
          status: 'checked_out'
        });

        hoursToCreate -= hoursForThisEntry;
      }

      if (newEntries.length === 0) {
        toast({
          title: "Sin días disponibles",
          description: "No hay días laborables disponibles para regularizar este mes",
        });
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('time_entries')
        .insert(newEntries);

      if (insertError) throw insertError;

      toast({
        title: "Regularización completada",
        description: `Se han creado ${newEntries.length} fichajes automáticamente (${remainingHours.toFixed(1)} horas)`,
      });

      setSelectedEmployee("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al regularizar los fichajes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activeEmployees = employees.filter(emp => emp.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Regularización Automática</h2>
        <p className="text-muted-foreground">Completa automáticamente los fichajes faltantes hasta 160 horas mensuales</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Regularizar Fichajes
          </CardTitle>
          <CardDescription>
            Selecciona un empleado para completar automáticamente sus fichajes del mes actual
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
            <span>Calcula las horas trabajadas del empleado en el mes actual</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <span>Determina las horas faltantes para llegar a 160 horas mensuales (40 horas semanales)</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>Crea fichajes respetando el horario real: L-V mañana (9-14h) y tarde (17-20h), sábados (11-14h)</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>Nunca crea fichajes en domingo ni fuera del horario laboral</span>
          </p>
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-warning-foreground">
              <strong>Nota:</strong> Solo se crearán fichajes en días sin registro previo y hasta la fecha actual. L-V genera hasta 2 fichajes por día (mañana y tarde).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
