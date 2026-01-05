import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, FileText, Calendar, CheckCircle, XCircle, Play, Square } from "lucide-react";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useVacations } from "@/hooks/useVacations";
import { useEmployees } from "@/hooks/useEmployees";
import { usePayroll } from "@/hooks/usePayroll";
import { useMemo, useState, useEffect } from "react";
import { format, isToday, isThisMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { RequestScheduleChangeDialog } from "@/components/dashboard/RequestScheduleChangeDialog";

// Quick Check-In Component
function QuickCheckInButton({ 
  isCheckedIn, 
  currentEntry, 
  onCheckIn, 
  onCheckOut,
  loading 
}: { 
  isCheckedIn: boolean; 
  currentEntry: any;
  onCheckIn: () => void;
  onCheckOut: () => void;
  loading: boolean;
}) {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckInOut = async () => {
    try {
      // Get geolocation
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        } catch (geoError) {
          console.warn('Geolocation error:', geoError);
          // Continue without location
        }
      }

      if (isCheckedIn) {
        await onCheckOut();
        toast({
          title: "¡Fichaje de salida registrado!",
          description: location 
            ? `Has fichado la salida correctamente en ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
            : "Has fichado la salida correctamente.",
        });
      } else {
        await onCheckIn();
        toast({
          title: "¡Fichaje de entrada registrado!",
          description: location 
            ? `Has fichado la entrada correctamente en ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
            : "Has fichado la entrada correctamente.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error al fichar",
        description: error.message || "Hubo un problema al registrar el fichaje.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <div className="text-4xl font-bold text-card-foreground">{currentTime}</div>
        <div className="text-muted-foreground">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <Badge 
            variant={isCheckedIn ? "default" : "outline"}
            className={`px-4 py-2 text-sm ${
              isCheckedIn 
                ? "bg-success text-success-foreground" 
                : "text-muted-foreground"
            }`}
          >
            {isCheckedIn ? "Fichado - En el trabajo" : "No fichado"}
          </Badge>
        </div>

        <Button
          onClick={handleCheckInOut}
          size="lg"
          disabled={loading}
          className={`h-16 px-8 text-lg font-semibold w-full ${
            isCheckedIn 
              ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
              : "bg-success hover:bg-success/90 text-success-foreground"
          }`}
        >
          {loading ? (
            "Procesando..."
          ) : isCheckedIn ? (
            <>
              <Square className="mr-2 h-6 w-6" />
              Fichar Salida
            </>
          ) : (
            <>
              <Play className="mr-2 h-6 w-6" />
              Fichar Entrada
            </>
          )}
        </Button>
      </div>

      {isCheckedIn && currentEntry?.check_in_time && (
        <div className="p-4 bg-success/20 rounded-lg border border-success/30">
          <p className="text-sm text-card-foreground">
            <strong>Entrada:</strong> {new Date(currentEntry.check_in_time).toLocaleTimeString('es-ES')}
          </p>
        </div>
      )}
    </div>
  );
}

interface DashboardProps {
  userRole: 'admin' | 'employee';
  onPageChange?: (page: string) => void;
}

export function Dashboard({ userRole, onPageChange }: DashboardProps) {
  const { timeEntries, currentEntry, checkIn, checkOut, loading, fetchTimeEntries } = useTimeEntries();
  const { vacationBalance, vacationRequests } = useVacations();
  const { employees } = useEmployees();
  const { payrollRecords } = usePayroll();

  // Refresh data every 30 seconds to keep dashboard updated
  useEffect(() => {
    if (fetchTimeEntries) {
      const interval = setInterval(() => {
        fetchTimeEntries();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Calculate employee stats from real data
  const employeeStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter entries for current month
    const currentMonthEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });

    // Calculate total hours this month
    const totalHours = currentMonthEntries.reduce((total, entry) => {
      if (entry.total_hours) {
        // Parse PostgreSQL interval (e.g., "08:30:00")
        const timeStr = entry.total_hours.toString();
        const match = timeStr.match(/(\d+):(\d+):(\d+)/);
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          return total + hours + (minutes / 60);
        }
      }
      return total;
    }, 0);

    // Count working days this month
    const workingDays = new Set(currentMonthEntries.map(entry => entry.date)).size;

    // Get last clock entry
    const lastEntry = timeEntries[0]; // Already ordered by date desc
    
    // Get this week entries (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekAgo;
    }).slice(0, 5); // Last 5 entries

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      workingDays,
      lastEntry,
      thisWeekEntries,
      remainingVacationDays: vacationBalance?.remaining_days || 0
    };
  }, [timeEntries, vacationBalance]);

  // Admin stats from real data
  const adminStats = useMemo(() => {
    const now = new Date();
    
    // Total active employees
    const totalEmployees = employees.filter(emp => emp.is_active).length;
    
    // Clock-ins today
    const todayEntries = timeEntries.filter(entry => isToday(new Date(entry.date)));
    
    // Pending payroll (draft status)
    const pendingPayroll = payrollRecords.filter(record => record.status === 'draft').length;
    
    // Pending vacation requests
    const pendingVacations = vacationRequests.filter(req => req.status === 'pending').length;
    
    // Recent clock-ins (last 5)
    const recentClockIns = timeEntries
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 4);
      
    // Pending vacation requests for approval
    const pendingVacationRequests = vacationRequests
      .filter(req => req.status === 'pending')
      .slice(0, 3);

    return {
      totalEmployees,
      todayEntries: todayEntries.length,
      pendingPayroll,
      pendingVacations,
      recentClockIns,
      pendingVacationRequests
    };
  }, [employees, timeEntries, payrollRecords, vacationRequests]);

  if (userRole === 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h2>
          <p className="text-muted-foreground">Resumen general del sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => onPageChange?.('employees')} className="cursor-pointer">
            <StatsCard
              title="Total Empleados"
              value={adminStats.totalEmployees.toString()}
              description="Empleados activos"
              icon={Users}
            />
          </div>
          <div onClick={() => onPageChange?.('attendance')} className="cursor-pointer">
            <StatsCard
              title="Fichajes Hoy"
              value={adminStats.todayEntries.toString()}
              description="Registros de empleados"
              icon={Clock}
            />
          </div>
          <div onClick={() => onPageChange?.('payroll')} className="cursor-pointer">
            <StatsCard
              title="Nóminas Pendientes"
              value={adminStats.pendingPayroll.toString()}
              description="Para completar"
              icon={FileText}
              trend={{ value: adminStats.pendingPayroll.toString(), isPositive: false }}
            />
          </div>
          <div onClick={() => onPageChange?.('vacations')} className="cursor-pointer">
            <StatsCard
              title="Solicitudes Vacaciones"
              value={adminStats.pendingVacations.toString()}
              description="Pendientes de aprobar"
              icon={Calendar}
              trend={{ value: adminStats.pendingVacations.toString(), isPositive: false }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Solicitudes Pendientes de Vacaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminStats.pendingVacationRequests.length > 0 ? adminStats.pendingVacationRequests.map((request) => {
                  const employee = employees.find(emp => emp.id === request.user_id);
                  return (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">{employee?.full_name || 'Empleado desconocido'}</p>
                        <p className="text-sm text-muted-foreground">
                          Vacaciones - {format(new Date(request.start_date), 'dd/MM', { locale: es })} al {format(new Date(request.end_date), 'dd/MM/yyyy', { locale: es })} ({request.total_days} días)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8">
                          Rechazar
                        </Button>
                        <Button size="sm" className="h-8">
                          Aprobar
                        </Button>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center text-muted-foreground py-4">No hay solicitudes pendientes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Employee Dashboard
  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 md:px-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">Mi Dashboard</h2>
        <p className="text-sm md:text-base text-card-foreground/70">Resumen de tu actividad</p>
      </div>

      {/* Quick Check-In Section - PRIMERO */}
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Clock className="h-6 w-6 text-primary" />
            Fichaje Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuickCheckInButton 
            isCheckedIn={currentEntry?.status === 'checked_in'} 
            currentEntry={currentEntry}
            onCheckIn={checkIn}
            onCheckOut={checkOut}
            loading={loading}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="Horas Este Mes"
          value={`${employeeStats.totalHours}h`}
          description="Horas trabajadas"
          icon={Clock}
        />
        <StatsCard
          title="Días Trabajados"
          value={employeeStats.workingDays.toString()}
          description="Este mes"
          icon={CheckCircle}
        />
        <StatsCard
          title="Vacaciones Restantes"
          value={`${employeeStats.remainingVacationDays} días`}
          description="Año actual"
          icon={Calendar}
        />
        <StatsCard
          title="Último Fichaje"
          value={employeeStats.lastEntry ? (
            employeeStats.lastEntry.check_out_time 
              ? new Date(employeeStats.lastEntry.check_out_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              : employeeStats.lastEntry.check_in_time 
                ? new Date(employeeStats.lastEntry.check_in_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                : "Sin fichajes"
          ) : "Sin fichajes"}
          description={employeeStats.lastEntry ? (
            employeeStats.lastEntry.check_out_time ? "Salida" : "Entrada"
          ) : ""}
          icon={currentEntry?.status === 'checked_in' ? Clock : XCircle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Mis Fichajes Esta Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeeStats.thisWeekEntries.length > 0 ? employeeStats.thisWeekEntries.map((entry, index) => {
                const entryDate = new Date(entry.date);
                const dayName = entryDate.toLocaleDateString('es-ES', { weekday: 'long' });
                const checkInTime = entry.check_in_time 
                  ? new Date(entry.check_in_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : '-';
                const checkOutTime = entry.check_out_time 
                  ? new Date(entry.check_out_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : '-';
                
                let hoursWorked = "Sin salida";
                if (entry.total_hours) {
                  const timeStr = entry.total_hours.toString();
                  const match = timeStr.match(/(\d+):(\d+):(\d+)/);
                  if (match) {
                    const hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    hoursWorked = `${hours}h ${minutes}m`;
                  }
                }

                return (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      entry.status === 'checked_out' ? 'bg-success' : 'bg-primary'
                    }`} />
                    <div>
                      <p className="font-medium capitalize">{dayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {checkInTime} - {checkOutTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{hoursWorked}</p>
                  </div>
                </div>
                );
              }) : (
                <div className="text-center py-4 text-muted-foreground">
                  No hay fichajes recientes
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow backdrop-blur-sm bg-card/50 border-primary/20">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Gestión de Horarios
          </CardTitle>
          <CardDescription>Solicita cambios de horario o vacaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <RequestScheduleChangeDialog />
        </CardContent>
      </Card>
    </div>
  );
}