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

      // Calculate remaining hours needed (40 hours per week, ~160 hours per month)
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

      // Calculate days needed (8 hours per day)
      const daysNeeded = Math.ceil(remainingHours / 8);
      const hoursPerDay = remainingHours / daysNeeded;

      // Get all days of the month
      const daysInMonth = lastDayOfMonth.getDate();
      const missingDays: string[] = [];

      for (let day = 1; day <= daysInMonth && missingDays.length < daysNeeded; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Skip weekends and existing entries
        if (date.getDay() !== 0 && date.getDay() !== 6 && !existingDates.has(dateStr) && date <= now) {
          missingDays.push(dateStr);
        }
      }

      // Create entries for missing days
      const newEntries = missingDays.map(date => {
        const hours = Math.floor(hoursPerDay);
        const minutes = Math.round((hoursPerDay - hours) * 60);
        
        return {
          user_id: selectedEmployee,
          date,
          check_in_time: `${date}T09:00:00`,
          check_out_time: `${date}T${String(9 + hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
          status: 'checked_out'
        };
      });

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
            <span>Crea fichajes automáticos en días laborables sin registro previo</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>Distribuye las horas de forma equitativa (aproximadamente 8 horas por día)</span>
          </p>
          <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-warning-foreground">
              <strong>Nota:</strong> Esta función solo creará fichajes en días laborables (lunes a viernes) del mes actual que no tengan registro previo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
