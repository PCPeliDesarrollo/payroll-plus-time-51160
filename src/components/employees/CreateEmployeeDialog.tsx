import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useToast } from "@/hooks/use-toast";

export function CreateEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createEmployee } = useEmployees();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "employee",
    department: "",
    employee_id: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Creating employee with data:', formData);
      const result = await createEmployee(formData);
      console.log('Employee created successfully:', result);
      toast({
        title: "Empleado creado",
        description: "El empleado ha sido añadido correctamente",
      });
      setOpen(false);
      setFormData({
        full_name: "",
        email: "",
        role: "employee",
        department: "",
        employee_id: "",
        password: "",
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error details:', errorMessage);
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
      <DialogContent className="sm:max-w-md">
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

          <div>
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Desarrollo, Marketing, RRHH..."
            />
          </div>

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