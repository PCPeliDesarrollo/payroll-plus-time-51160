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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'employee';
    companyName?: string;
  };
  onLogout: () => void;
  onPageChange?: (page: string) => void;
}

export function Header({ user, onLogout, onPageChange }: HeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationMessage = (notification: any) => {
    const date = format(new Date(notification.created_at), "dd MMM, HH:mm", { locale: es });
    return `${notification.message} - ${date}`;
  };
  
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-3 md:ml-0 ml-14">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-2 backdrop-blur-sm border border-primary/20">
          <img src="/logo.png" alt="Peli Soluciones Informáticas" className="h-10 md:h-12 w-auto drop-shadow-[0_0_8px_rgba(176,98,248,0.4)]" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Sistema de Fichajes
          </h1>
          {user.companyName && user.role !== 'super_admin' && (
            <p className="text-xs md:text-sm text-muted-foreground">
              {user.companyName}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-card-foreground" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Notificaciones</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Marcar como leídas
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No tienes notificaciones</p>
              ) : notifications.filter(n => !n.is_read).length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No tienes notificaciones nuevas</p>
              ) : (
                <div className="space-y-2">
                  {notifications.filter(n => !n.is_read).map((notification) => {
                    const getNavigationPage = (type: string) => {
                      if (type === 'vacation_request') return 'vacations';
                      if (type === 'schedule_change') return 'schedule-changes';
                      return null;
                    };

                    const handleNotificationClick = () => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                      const page = getNavigationPage(notification.type);
                      if (page && onPageChange) {
                        onPageChange(page);
                      }
                    };

                    return (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          notification.is_read
                            ? "bg-secondary/30 hover:bg-secondary/50"
                            : "bg-primary/10 hover:bg-primary/20"
                        }`}
                        onClick={handleNotificationClick}
                      >
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getNotificationMessage(notification)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10 px-2 md:px-3 relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrador' : 'Empleado'}
                </p>
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

    </header>
  );
}