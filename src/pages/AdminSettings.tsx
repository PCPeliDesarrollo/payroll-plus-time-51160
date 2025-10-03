import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Eye
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useEmployees } from "@/hooks/useEmployees";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useVacations } from "@/hooks/useVacations";
import { usePayroll } from "@/hooks/usePayroll";
import { format, isThisMonth, isToday } from "date-fns";
import { es } from "date-fns/locale";

export function AdminSettings() {
  const { employees } = useEmployees();
  const { timeEntries } = useTimeEntries();
  const { vacationRequests } = useVacations();
  const { payrollRecords } = usePayroll();

  // Cálculos en tiempo real
  const stats = useMemo(() => {
    const totalEmployees = employees.filter(emp => emp.is_active).length;
    
    // Fichajes de hoy
    const todayEntries = timeEntries.filter(entry => 
      isToday(new Date(entry.date))
    );
    
    // Fichajes del mes actual
    const monthEntries = timeEntries.filter(entry => 
      isThisMonth(new Date(entry.date))
    );

    // Solicitudes de vacaciones pendientes
    const pendingVacations = vacationRequests.filter(req => req.status === 'pending');
    
    // Nóminas completadas este mes
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const completedPayrolls = payrollRecords.filter(record => 
      record.month === currentMonth && 
      record.year === currentYear && 
      record.status === 'completed'
    );

    return {
      totalEmployees,
      todayEntries: todayEntries.length,
      monthEntries: monthEntries.length,
      pendingVacations: pendingVacations.length,
      completedPayrolls: completedPayrolls.length,
    };
  }, [employees, timeEntries, vacationRequests, payrollRecords]);

  // Últimos fichajes (5 más recientes)
  const recentTimeEntries = useMemo(() => {
    return timeEntries
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [timeEntries]);

  // Últimas solicitudes de vacaciones (5 más recientes)
  const recentVacationRequests = useMemo(() => {
    return vacationRequests
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [vacationRequests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      case 'checked_in':
        return <Badge className="bg-primary text-primary-foreground">Presente</Badge>;
      case 'checked_out':
        return <Badge className="bg-success text-success-foreground">Completado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Panel de Configuración</h2>
          <p className="text-muted-foreground">Vista general del sistema y actividad reciente</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Empleados"
          value={stats.totalEmployees.toString()}
          description="Empleados activos"
          icon={Users}
        />
        <StatsCard
          title="Fichajes Hoy"
          value={stats.todayEntries.toString()}
          description="Registros de hoy"
          icon={Clock}
        />
        <StatsCard
          title="Fichajes del Mes"
          value={stats.monthEntries.toString()}
          description="Total este mes"
          icon={TrendingUp}
        />
        <StatsCard
          title="Vacaciones Pendientes"
          value={stats.pendingVacations.toString()}
          description="Requieren aprobación"
          icon={Calendar}
          className={stats.pendingVacations > 0 ? "border-accent/30 bg-accent/10" : ""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Fichajes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Últimos Fichajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTimeEntries.length > 0 ? recentTimeEntries.map((entry) => {
                // Buscar el empleado correspondiente
                const employee = employees.find(emp => emp.id === entry.user_id);
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="font-medium">{employee?.full_name || 'Empleado desconocido'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.date), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(entry.status)}
                      <p className="text-sm text-muted-foreground">
                        {entry.check_in_time && new Date(entry.check_in_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {entry.check_out_time && ` - ${new Date(entry.check_out_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center text-muted-foreground py-4">No hay fichajes recientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Últimas Solicitudes de Vacaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Últimas Solicitudes de Vacaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVacationRequests.length > 0 ? recentVacationRequests.map((request) => {
                const employee = employees.find(emp => emp.id === request.user_id);
                return (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="font-medium">{employee?.full_name || 'Empleado desconocido'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.start_date), 'dd/MM', { locale: es })} - {format(new Date(request.end_date), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(request.status)}
                      <p className="text-sm text-muted-foreground">
                        {request.total_days} días
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-center text-muted-foreground py-4">No hay solicitudes recientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Base de Datos</span>
              </div>
              <Badge className="bg-success text-success-foreground">Conectada</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Almacenamiento</span>
              </div>
              <Badge className="bg-success text-success-foreground">Disponible</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Autenticación</span>
              </div>
              <Badge className="bg-success text-success-foreground">Activa</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}