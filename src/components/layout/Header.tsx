import { Bell, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useVacations } from "@/hooks/useVacations";
import { useScheduleChanges } from "@/hooks/useScheduleChanges";
import { useEffect, useState } from "react";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: 'admin' | 'employee';
  };
  onLogout: () => void;
  onPageChange?: (page: string) => void;
}

export function Header({ user, onLogout, onPageChange }: HeaderProps) {
  const { vacationRequests } = useVacations();
  const { scheduleChanges } = useScheduleChanges();
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  
  // Filtrar solicitudes pendientes
  const pendingRequests = vacationRequests.filter(req => req.status === 'pending');
  const pendingScheduleChanges = scheduleChanges.filter(change => change.status === 'pending');
  const totalPending = user.role === 'admin' ? (pendingRequests.length + pendingScheduleChanges.length) : 0;
  
  // Mostrar pop-up automáticamente cuando hay solicitudes pendientes
  useEffect(() => {
    if (user.role === 'admin' && totalPending > 0) {
      // Mostrar después de un pequeño delay para que no sea tan intrusivo
      const timer = setTimeout(() => {
        setShowNotificationDialog(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [totalPending, user.role]);
  
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3 md:ml-0 ml-14">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-2 backdrop-blur-sm border border-primary/20">
          <img src="/logo-peli.png" alt="Peli Soluciones Informáticas" className="h-10 md:h-12 w-auto drop-shadow-[0_0_8px_rgba(176,98,248,0.4)]" />
        </div>
        <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">Sistema de Fichajes</h1>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        {user.role === 'admin' && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hidden sm:flex"
            onClick={() => setShowNotificationDialog(true)}
          >
            <Bell className="h-5 w-5" />
            {totalPending > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {totalPending}
              </Badge>
            )}
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10 px-2 md:px-3 relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user.role === 'admin' && totalPending > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs sm:hidden"
                >
                  {totalPending}
                </Badge>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onPageChange?.('my-profile')}>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            {user.role === 'employee' && (
              <DropdownMenuItem onClick={() => onPageChange?.('my-profile')}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Pop-up de notificaciones */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Solicitudes Pendientes
            </DialogTitle>
            <DialogDescription>
              Tienes {totalPending} {totalPending === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'} de aprobación
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingRequests.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Vacaciones ({pendingRequests.length})</h4>
                {pendingRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className="p-3 bg-secondary/50 rounded-lg border hover:bg-secondary/70 transition-colors"
                  >
                    <p className="font-medium text-sm">Solicitud de vacaciones</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(request.start_date).toLocaleDateString('es-ES')} - {new Date(request.end_date).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.total_days} {request.total_days === 1 ? 'día' : 'días'}
                    </p>
                    {request.reason && (
                      <p className="text-xs mt-2 text-foreground/80">
                        Motivo: {request.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {pendingScheduleChanges.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Cambios de Horario ({pendingScheduleChanges.length})</h4>
                {pendingScheduleChanges.map((change) => (
                  <div 
                    key={change.id} 
                    className="p-3 bg-secondary/50 rounded-lg border hover:bg-secondary/70 transition-colors"
                  >
                    <p className="font-medium text-sm">{change.profiles?.full_name || 'Empleado'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fecha: {new Date(change.requested_date).toLocaleDateString('es-ES')}
                    </p>
                    {change.reason && (
                      <p className="text-xs mt-2 text-foreground/80">
                        Motivo: {change.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowNotificationDialog(false)}
            >
              Cerrar
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                setShowNotificationDialog(false);
                onPageChange?.('admin-vacations');
              }}
            >
              Ver Todas
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}