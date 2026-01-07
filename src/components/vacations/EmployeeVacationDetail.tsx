import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { VacationCalendar } from "./VacationCalendar";
import { EditVacationRequestDialog } from "./EditVacationRequestDialog";
import { VacationPeriodsCard } from "./VacationPeriodsCard";
import { ExtraHoursSection } from "@/components/extrahours/ExtraHoursSection";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExtraHours } from "@/hooks/useExtraHours";
import { useVacationPeriods } from "@/hooks/useVacationPeriods";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  full_name: string;
  department: string | null;
}

interface VacationRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_days: number;
  reason?: string;
  comments?: string;
  period_id?: string | null;
}

interface VacationBalance {
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
  period_start: string | null;
  period_end: string | null;
}

interface EmployeeVacationDetailProps {
  employee: Employee;
  vacationRequests: VacationRequest[];
  onBack: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

// Get current period year
const getCurrentPeriodYear = (): number => {
  const now = new Date();
  return now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
};

export function EmployeeVacationDetail({
  employee,
  vacationRequests,
  onBack,
  onApprove,
  onReject,
  onDelete,
}: EmployeeVacationDetailProps) {
  const [showEditVacation, setShowEditVacation] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<VacationRequest | null>(null);
  const [selectedPeriodYear, setSelectedPeriodYear] = useState<number>(getCurrentPeriodYear());
  const [vacationBalance, setVacationBalance] = useState<VacationBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  
  const { periods } = useVacationPeriods();
  const { 
    extraHours, 
    extraHoursRequests, 
    balance: extraHoursBalance, 
    addExtraHours, 
    deleteExtraHours, 
    approveExtraHoursRequest, 
    rejectExtraHoursRequest,
    deleteExtraHoursRequest,
    fetchExtraHours 
  } = useExtraHours();
  const { toast } = useToast();

  // Fetch balance for selected period
  useEffect(() => {
    const fetchBalanceForPeriod = async () => {
      if (!employee.id) return;
      
      setBalanceLoading(true);
      try {
        // First try to get existing balance for this period
        const { data, error } = await supabase
          .from('vacation_balance')
          .select('*')
          .eq('user_id', employee.id)
          .eq('year', selectedPeriodYear)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setVacationBalance(data);
        } else {
          // Calculate balance from vacation requests for this period
          const selectedPeriod = periods.find(p => p.year === selectedPeriodYear);
          if (selectedPeriod) {
            // Count approved vacation days within this period
            const periodRequests = vacationRequests.filter(req => {
              if (req.user_id !== employee.id) return false;
              if (req.status === 'rejected') return false;
              
              const reqStart = new Date(req.start_date);
              const periodStart = new Date(selectedPeriod.period_start);
              const periodEnd = new Date(selectedPeriod.period_end);
              
              return reqStart >= periodStart && reqStart <= periodEnd;
            });
            
            const usedDays = periodRequests
              .filter(req => req.status === 'approved')
              .reduce((sum, req) => sum + req.total_days, 0);
            
            setVacationBalance({
              total_days: 22,
              used_days: usedDays,
              remaining_days: 22 - usedDays,
              year: selectedPeriodYear,
              period_start: selectedPeriod.period_start,
              period_end: selectedPeriod.period_end
            });
          } else {
            setVacationBalance(null);
          }
        }
      } catch (error) {
        console.error("Error fetching vacation balance:", error);
        setVacationBalance(null);
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalanceForPeriod();
  }, [employee.id, selectedPeriodYear, periods, vacationRequests]);

  useEffect(() => {
    fetchExtraHours(employee.id);
  }, [employee.id]);

  const handleEditVacation = async (id: string, updates: { start_date: string; end_date: string; total_days: number }) => {
    try {
      // Validar que no haya solapamiento con otras solicitudes (excluyendo la actual)
      const overlappingRequests = vacationRequests.filter(req => {
        // Excluir la solicitud actual y las rechazadas
        if (req.id === id || req.status === 'rejected') return false;
        
        const existingStart = req.start_date;
        const existingEnd = req.end_date;
        const requestedStart = updates.start_date;
        const requestedEnd = updates.end_date;
        
        // Verificar si hay solapamiento de fechas
        return (
          (requestedStart >= existingStart && requestedStart <= existingEnd) ||
          (requestedEnd >= existingStart && requestedEnd <= existingEnd) ||
          (requestedStart <= existingStart && requestedEnd >= existingEnd)
        );
      });

      if (overlappingRequests.length > 0) {
        const overlappingDates = overlappingRequests.map(req => 
          `${req.start_date} - ${req.end_date} (${req.status === 'pending' ? 'Pendiente' : 'Aprobada'})`
        ).join(', ');
        
        toast({
          title: "Error: Días ya solicitados",
          description: `Los días se solapan con otras solicitudes: ${overlappingDates}`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("vacation_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Solicitud actualizada",
        description: "La solicitud de vacaciones ha sido actualizada correctamente",
      });
      
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la solicitud",
      });
      throw error;
    }
  };

  // Filter requests for this employee and selected period
  const selectedPeriod = periods.find(p => p.year === selectedPeriodYear);
  const employeeRequests = vacationRequests.filter((req) => {
    if (req.user_id !== employee.id) return false;
    
    if (selectedPeriod) {
      const reqStart = new Date(req.start_date);
      const periodStart = new Date(selectedPeriod.period_start);
      const periodEnd = new Date(selectedPeriod.period_end);
      
      return reqStart >= periodStart && reqStart <= periodEnd;
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-pending text-pending-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprobada
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazada
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Preparar datos para el calendario - solo incluir vacaciones del periodo seleccionado
  const calendarVacations = employeeRequests.flatMap((request) => {
    const days = [];
    const start = new Date(request.start_date + 'T12:00:00');
    const end = new Date(request.end_date + 'T12:00:00');

    // Calcular días entre fechas correctamente
    const currentDate = new Date(start);
    while (currentDate <= end) {
      days.push({
        date: currentDate.toISOString().split('T')[0],
        status: request.status as "pending" | "approved" | "rejected",
        employeeName: employee.full_name,
        reason: request.reason,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  });

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack} className="mb-4 w-full sm:w-auto">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a la lista
      </Button>

      {/* Vacation Period Selector */}
      <VacationPeriodsCard 
        selectedPeriodYear={selectedPeriodYear} 
        onPeriodChange={setSelectedPeriodYear} 
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Días Totales</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="animate-pulse h-9 bg-muted rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-primary">
                {vacationBalance?.total_days || 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Días Usados</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="animate-pulse h-9 bg-muted rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-accent">
                {vacationBalance?.used_days || 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Días Restantes</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="animate-pulse h-9 bg-muted rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-green-500">
                {vacationBalance?.remaining_days || 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sección de Horas Extra */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horas Extra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExtraHoursSection
            extraHours={extraHours.filter(h => h.user_id === employee.id)}
            extraHoursRequests={extraHoursRequests.filter(r => r.user_id === employee.id)}
            balance={extraHoursBalance}
            isAdmin={true}
            userId={employee.id}
            onAddHours={addExtraHours}
            onDeleteHours={deleteExtraHours}
            onApproveRequest={approveExtraHoursRequest}
            onRejectRequest={rejectExtraHoursRequest}
            onDeleteRequest={deleteExtraHoursRequest}
          />
        </CardContent>
      </Card>

      <VacationCalendar vacations={calendarVacations} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Solicitudes de {employee.full_name} - Periodo {selectedPeriodYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeeRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay solicitudes de vacaciones en este periodo
            </p>
          ) : (
            <div className="space-y-4">
              {employeeRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.start_date), "d 'de' MMMM", {
                              locale: es,
                            })}{" "}
                            -{" "}
                            {format(new Date(request.end_date), "d 'de' MMMM yyyy", {
                              locale: es,
                            })}
                          </p>
                          <p className="font-semibold">
                            {request.total_days} día{request.total_days !== 1 ? "s" : ""}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      {request.reason && (
                        <div className="text-sm">
                          <span className="font-medium">Motivo: </span>
                          <span className="text-muted-foreground">{request.reason}</span>
                        </div>
                      )}

                      {request.comments && (
                        <div className="text-sm">
                          <span className="font-medium">Comentarios: </span>
                          <span className="text-muted-foreground">{request.comments}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 flex-wrap">
                        {(request.status === "approved" || request.status === "pending") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVacation(request);
                              setShowEditVacation(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        )}
                        {request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onApprove(request.id)}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onReject(request.id)}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        {(request.status === "approved" || request.status === "rejected") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(request.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditVacationRequestDialog
        open={showEditVacation}
        onOpenChange={setShowEditVacation}
        vacationRequest={selectedVacation}
        onSubmit={handleEditVacation}
      />
    </div>
  );
}
