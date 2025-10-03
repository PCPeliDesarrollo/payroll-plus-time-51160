import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, DollarSign, Download } from "lucide-react";
import { VacationCalendar } from "./VacationCalendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PayrollRecord = {
  id: string;
  user_id: string;
  month: number;
  year: number;
  base_salary: number | null;
  file_url: string | null;
  created_at: string;
};

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
}

export function EmployeeVacationDetail({
  employee,
  vacationRequests,
  vacationBalance,
  onBack,
  onApprove,
  onReject,
}: EmployeeVacationDetailProps) {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  useEffect(() => {
    fetchPayrollRecords();
  }, [employee.id]);

  const fetchPayrollRecords = async () => {
    setLoadingPayroll(true);
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('user_id', employee.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(6);

      if (error) throw error;
      setPayrollRecords(data || []);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
    } finally {
      setLoadingPayroll(false);
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

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

  // Preparar datos para el calendario
  const calendarVacations = employeeRequests.flatMap((request) => {
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    const days = [];

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      days.push({
        date: date.toISOString(),
        status: request.status as "pending" | "approved" | "rejected",
        employeeName: employee.full_name,
        reason: request.reason,
      });
    }

    return days;
  });

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a la lista
      </Button>

      <div className="grid gap-4 md:grid-cols-3">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Nóminas recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPayroll ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando nóminas...</p>
            </div>
          ) : payrollRecords.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay nóminas registradas
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {payrollRecords.map((record) => (
                <Card key={record.id} className="border-muted">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm md:text-base">
                          {monthNames[record.month - 1]} {record.year}
                        </p>
                        {record.base_salary && (
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {record.base_salary.toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR'
                            })}
                          </p>
                        )}
                      </div>
                      {record.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 md:h-4 md:w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
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

                      {request.status === "pending" && (
                        <div className="flex gap-2 pt-2">
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
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
