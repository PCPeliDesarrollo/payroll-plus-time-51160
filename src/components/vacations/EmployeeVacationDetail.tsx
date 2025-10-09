import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, Plus, Edit, Trash2 } from "lucide-react";
import { VacationCalendar } from "./VacationCalendar";
import { AddCompensatoryDayDialog } from "./AddCompensatoryDayDialog";
import { EditVacationRequestDialog } from "./EditVacationRequestDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompensatoryDays } from "@/hooks/useCompensatoryDays";
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
}

interface VacationBalance {
  total_days: number;
  used_days: number;
  remaining_days: number;
}

interface EmployeeVacationDetailProps {
  employee: Employee;
  vacationRequests: VacationRequest[];
  vacationBalance: VacationBalance | null;
  onBack: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EmployeeVacationDetail({
  employee,
  vacationRequests,
  vacationBalance,
  onBack,
  onApprove,
  onReject,
  onDelete,
}: EmployeeVacationDetailProps) {
  const [showAddCompensatoryDay, setShowAddCompensatoryDay] = useState(false);
  const [showEditVacation, setShowEditVacation] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<VacationRequest | null>(null);
  
  const { compensatoryDays, addCompensatoryDay, deleteCompensatoryDay, fetchCompensatoryDays } = useCompensatoryDays();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompensatoryDays(employee.id);
  }, [employee.id]);

  const handleAddCompensatoryDay = async (data: { user_id: string; date: string; reason: string }) => {
    try {
      await addCompensatoryDay(data);
      toast({
        title: "Día libre añadido",
        description: "El día libre compensatorio ha sido añadido correctamente",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir el día libre",
      });
      throw error;
    }
  };

  const handleDeleteCompensatoryDay = async (id: string) => {
    try {
      await deleteCompensatoryDay(id);
      toast({
        title: "Día libre eliminado",
        description: "El día libre compensatorio ha sido eliminado",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el día libre",
      });
    }
  };

  const handleEditVacation = async (id: string, updates: { start_date: string; end_date: string; total_days: number }) => {
    try {
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


  const employeeRequests = vacationRequests.filter(
    (req) => req.user_id === employee.id
  );

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

  // Preparar datos para el calendario - solo incluir vacaciones específicas
  const calendarVacations = [
    ...employeeRequests.flatMap((request) => {
      const days = [];
      const start = new Date(request.start_date + 'T00:00:00');
      const end = new Date(request.end_date + 'T00:00:00');

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push({
          date: d.toISOString().split('T')[0],
          status: request.status as "pending" | "approved" | "rejected" | "compensatory",
          employeeName: employee.full_name,
          reason: request.reason,
        });
      }

      return days;
    }),
    ...compensatoryDays.map((day) => ({
      date: day.date,
      status: "compensatory" as "pending" | "approved" | "rejected" | "compensatory",
      employeeName: employee.full_name,
      reason: day.reason,
    }))
  ];

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack} className="mb-4 w-full sm:w-auto">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a la lista
      </Button>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Días Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {vacationBalance?.total_days || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Días Usados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">
              {vacationBalance?.used_days || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Días Restantes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              {vacationBalance?.remaining_days || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <VacationCalendar vacations={calendarVacations} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Días Libres Compensatorios</CardTitle>
          <Button
            onClick={() => setShowAddCompensatoryDay(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Añadir día libre
          </Button>
        </CardHeader>
        <CardContent>
          {compensatoryDays.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay días libres compensatorios registrados
            </p>
          ) : (
            <div className="space-y-3">
              {compensatoryDays.map((day) => (
                <div
                  key={day.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {format(new Date(day.date), "dd/MM/yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">{day.reason}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCompensatoryDay(day.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Solicitudes de {employee.full_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeeRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay solicitudes de vacaciones
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

      <AddCompensatoryDayDialog
        open={showAddCompensatoryDay}
        onOpenChange={setShowAddCompensatoryDay}
        employeeId={employee.id}
        employeeName={employee.full_name}
        onSubmit={handleAddCompensatoryDay}
      />

      <EditVacationRequestDialog
        open={showEditVacation}
        onOpenChange={setShowEditVacation}
        vacationRequest={selectedVacation}
        onSubmit={handleEditVacation}
      />
    </div>
  );
}
