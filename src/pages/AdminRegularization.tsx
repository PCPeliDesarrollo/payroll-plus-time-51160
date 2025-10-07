import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, Calendar } from "lucide-react";

export function AdminRegularization() {
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [date, setDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegularize = async () => {
    if (!selectedEmployee || !date || !checkInTime || !checkOutTime) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Crear timestamp completo
      const checkInTimestamp = `${date}T${checkInTime}:00`;
      const checkOutTimestamp = `${date}T${checkOutTime}:00`;

      // Verificar si ya existe un registro para ese día
      const { data: existing } = await supabase
        .from('time_entries')
        .select('id')
        .eq('user_id', selectedEmployee)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('time_entries')
          .update({
            check_in_time: checkInTimestamp,
            check_out_time: checkOutTimestamp,
            status: 'checked_out',
            notes: 'Regularizado por administrador'
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Crear nuevo registro
        const { error } = await supabase
          .from('time_entries')
          .insert({
            user_id: selectedEmployee,
            date: date,
            check_in_time: checkInTimestamp,
            check_out_time: checkOutTimestamp,
            status: 'checked_out',
            notes: 'Regularizado por administrador'
          });

        if (error) throw error;
      }

      toast({
        title: "¡Regularización completada!",
        description: "El fichaje ha sido regularizado correctamente",
      });

      // Limpiar formulario
      setSelectedEmployee("");
      setDate("");
      setCheckInTime("");
      setCheckOutTime("");
    } catch (error: any) {
      toast({
        title: "Error al regularizar",
        description: error.message,
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
        <h2 className="text-3xl font-bold text-foreground">Regularización de Fichajes</h2>
        <p className="text-muted-foreground">Registra fichajes manualmente para empleados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Regularizar Fichaje
          </CardTitle>
          <CardDescription>
            Completa los datos para crear o actualizar un fichaje de un empleado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Empleado</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.employee_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkIn">Hora de Entrada</Label>
              <Input
                id="checkIn"
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOut">Hora de Salida</Label>
              <Input
                id="checkOut"
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleRegularize} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Regularizando..." : "Regularizar Fichaje"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Información</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Si el empleado ya tiene un fichaje para esa fecha, se actualizará</p>
          <p>• Si no existe fichaje, se creará uno nuevo</p>
          <p>• El fichaje quedará marcado como "Regularizado por administrador"</p>
          <p>• La hora de salida debe ser posterior a la hora de entrada</p>
        </CardContent>
      </Card>
    </div>
  );
}
