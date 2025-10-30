import { Home, Clock, Users, FileText, Calendar, Settings, LogOut, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  userRole: 'super_admin' | 'admin' | 'employee';
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

export function Sidebar({ userRole, currentPage, onPageChange, onLogout }: SidebarProps) {
  const [open, setOpen] = useState(false);
  
  const superAdminMenuItems = [
    { id: 'super-admin', label: 'Panel Super Admin', icon: Users },
    { id: 'dashboard', label: 'Dashboard General', icon: Home },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'employees', label: 'Empleados', icon: Users },
    { id: 'attendance', label: 'Fichajes', icon: Clock },
    { id: 'payroll', label: 'Nóminas', icon: FileText },
    { id: 'vacations', label: 'Vacaciones', icon: Calendar },
    { id: 'schedule-changes', label: 'Cambios Horario', icon: Clock },
    { id: 'settings', label: 'Configuración', icon: Settings },
    { id: 'regularization', label: 'Regularización', icon: ClipboardCheck },
  ];

  const employeeMenuItems = [
    { id: 'dashboard', label: 'Mi Dashboard', icon: Home },
    { id: 'my-attendance', label: 'Mis Fichajes', icon: Clock },
    { id: 'my-vacations', label: 'Mis Vacaciones', icon: Calendar },
    { id: 'my-schedule-changes', label: 'Cambios de Horario', icon: Clock },
    { id: 'my-payroll', label: 'Mis Nóminas', icon: FileText },
    { id: 'my-profile', label: 'Mi Perfil', icon: Settings },
  ];

  const menuItems = userRole === 'super_admin' 
    ? superAdminMenuItems 
    : userRole === 'admin' 
    ? adminMenuItems 
    : employeeMenuItems;

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-primary">
          {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin Panel' : 'Panel Empleado'}
        </h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-12 text-left font-medium transition-all",
                currentPage === item.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
              onClick={() => handlePageChange(item.id)}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 h-screen bg-card border-r border-border flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon" className="bg-card shadow-lg border-primary/20">
            <Menu className="h-5 w-5 text-primary" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-secondary/30">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}