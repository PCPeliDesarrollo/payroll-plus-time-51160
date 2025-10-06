import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Lock,
  User,
  Mail,
  Shield,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function AdminSettings() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
      });

      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Configuración</h2>
          <p className="text-muted-foreground">Gestiona tu cuenta y preferencias</p>
        </div>
      </div>

      {/* Información del Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Información del Perfil
          </CardTitle>
          <CardDescription>
            Tu información personal y rol en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nombre Completo</Label>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="font-medium">{profile?.full_name || 'No disponible'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <div className="p-3 bg-secondary/50 rounded-lg flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{user?.email || 'No disponible'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Rol</Label>
              <div className="p-3 bg-secondary/50 rounded-lg flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <p className="font-medium capitalize">{profile?.role || 'No disponible'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Departamento</Label>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="font-medium">{profile?.department || 'Sin asignar'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cambiar Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite la nueva contraseña"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>
            <Button 
              onClick={handlePasswordChange}
              disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full md:w-auto"
            >
              {loading ? "Actualizando..." : "Cambiar Contraseña"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>
            Servicios conectados y funcionando
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Base de Datos</span>
              </div>
              <div className="text-sm text-success font-medium">Conectada</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Almacenamiento</span>
              </div>
              <div className="text-sm text-success font-medium">Disponible</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Autenticación</span>
              </div>
              <div className="text-sm text-success font-medium">Activa</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}