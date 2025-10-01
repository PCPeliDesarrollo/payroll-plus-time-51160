import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone,
  Calendar,
  Clock,
  User,
  Building,
  Edit,
  Save,
  X
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEmployees } from "@/hooks/useEmployees";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface EmployeeDetailsDialogProps {
  employee: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDetailsDialog({ employee, open, onOpenChange }: EmployeeDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateEmployee } = useEmployees();
  const { toast } = useToast();
  
  const [editData, setEditData] = useState({
    full_name: "",
    department: "",
    employee_id: "",
    role: ""
  });
  
  if (!employee) return null;
  
  // Update edit data when employee changes
  if (editData.full_name === "" && employee) {
    setEditData({
      full_name: employee.full_name,
      department: employee.department || "",
      employee_id: employee.employee_id || "",
      role: employee.role
    });
  }
  
  const handleSave = async () => {
    try {
      setLoading(true);
      await updateEmployee(employee.id, editData);
      toast({
        title: "Empleado actualizado",
        description: "Los datos han sido guardados correctamente",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el empleado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setEditData({
      full_name: employee.full_name,
      department: employee.department || "",
      employee_id: employee.employee_id || "",
      role: employee.role
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Detalles del Empleado
            <div className="flex gap-2">
              {!isEditing ? (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    {loading ? "Guardando..." : "Guardar"}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar y nombre */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {employee.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editData.full_name}
                    onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                    className="text-lg font-semibold"
                    placeholder="Nombre completo"
                  />
                  <Input
                    value={editData.role}
                    onChange={(e) => setEditData({...editData, role: e.target.value})}
                    className="text-sm"
                    placeholder="Rol"
                  />
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">{employee.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{employee.role || 'Sin rol'}</p>
                </>
              )}
              <Badge 
                variant={employee.is_active ? 'default' : 'secondary'}
                className={employee.is_active ? 'bg-success text-success-foreground' : ''}
              >
                {employee.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Información de Contacto
            </h4>
            
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{employee.email}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  value={editData.employee_id}
                  onChange={(e) => setEditData({...editData, employee_id: e.target.value})}
                  placeholder="ID del empleado"
                  className="text-sm"
                />
              ) : (
                <span className="text-sm">ID: {employee.employee_id || 'No asignado'}</span>
              )}
            </div>
          </div>

          {/* Información laboral */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Información Laboral
            </h4>
            
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  value={editData.role}
                  onChange={(e) => setEditData({...editData, role: e.target.value})}
                  placeholder="Rol del empleado"
                  className="text-sm"
                />
              ) : (
                <span className="text-sm">{employee.role || 'Sin rol asignado'}</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  value={editData.department}
                  onChange={(e) => setEditData({...editData, department: e.target.value})}
                  placeholder="Departamento"
                  className="text-sm"
                />
              ) : (
                <span className="text-sm">{employee.department || 'Sin departamento'}</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Desde {employee.hire_date ? format(new Date(employee.hire_date), 'dd \'de\' MMMM \'de\' yyyy', { locale: es }) : 'No especificado'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Creado {format(new Date(employee.created_at!), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}