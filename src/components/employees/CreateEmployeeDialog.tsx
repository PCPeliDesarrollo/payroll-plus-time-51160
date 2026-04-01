import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export function CreateEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createEmployee } = useEmployees();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "employee",
    department: "",
    employee_id: "",
    phone: "",
    password: "",
  });

  const [schedules, setSchedules] = useState<Record<number, DaySchedule>>({ ...DEFAULT_SCHEDULES });

  const updateSchedule = (day: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedules(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get admin's company_id
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id || '')
        .single();

      const companyId = adminProfile?.company_id;

      const result = await createEmployee(formData);
      
      // After employee is created, save their schedule
      if (result?.user?.id && companyId) {
        const scheduleRows = DAYS_OF_WEEK.map(day => ({
          employee_id: result.user.id,
          company_id: companyId,
          day_of_week: day.value,
          is_working_day: schedules[day.value].is_working_day,
          check_in_time: schedules[day.value].check_in_time,
          check_out_time: schedules[day.value].check_out_time,
        }));

        const { error: scheduleError } = await supabase
          .from('employee_schedules')
          .insert(scheduleRows);

        if (scheduleError) {
          console.error('Error saving employee schedule:', scheduleError);
          toast({
            title: "Empleado creado",
            description: "El empleado fue creado pero hubo un error al guardar su horario. Puedes configurarlo después.",
            variant: "default",
          });
        } else {
          toast({
            title: "Empleado creado",
            description: "El empleado y su horario han sido configurados correctamente",
          });
        }
      } else {
        toast({
          title: "Empleado creado",
          description: "El empleado ha sido añadido correctamente",
        });
      }

      setOpen(false);
      setFormData({
        full_name: "",
        email: "",
        role: "employee",
        department: "",
        employee_id: "",
        phone: "",
        password: "",
      });
      setSchedules({ ...DEFAULT_SCHEDULES });
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al crear empleado",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Empleado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Empleado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Ej: Ana García López"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email corporativo</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ana.garcia@empresa.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="employee_id">ID Empleado</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="EMP001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Desarrollo, Marketing..."
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-base font-semibold">Horario del Empleado</Label>
            <p className="text-xs text-muted-foreground">Configura el horario laboral individual. Se usará para la regularización de fichajes.</p>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.value} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                  <div className="w-24 font-medium text-sm text-card-foreground">{day.label}</div>
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

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.full_name || !formData.email || !formData.password} className="flex-1">
              {loading ? "Creando..." : "Crear Empleado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
