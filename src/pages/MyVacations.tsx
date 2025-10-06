import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Calendar as CalendarIcon, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Plane,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useVacations } from "@/hooks/useVacations";
import { useToast } from "@/hooks/use-toast";

export function MyVacations() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const { vacationRequests, vacationBalance, loading, createVacationRequest } = useVacations();
  const { toast } = useToast();

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Debes seleccionar las fechas de inicio y fin",
        variant: "destructive",
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: "Error", 
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
        variant: "destructive",
      });
      return;
    }

    try {
      await createVacationRequest({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        reason,
        approved_at: null,
        approved_by: null, 
        comments: null,
      });

      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud de vacaciones ha sido enviada correctamente",
      });

      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al enviar la solicitud",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-success text-success-foreground">Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-primary" />;
    }
  };

  // Group requests by month
  const requestsByMonth = React.useMemo(() => {
    const grouped: Record<string, typeof vacationRequests> = {};
    vacationRequests.forEach(request => {
      const date = new Date(request.start_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(request);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [vacationRequests]);

  // Calendar functions
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getVacationForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return vacationRequests.filter(request => {
      const start = new Date(request.start_date);
      const end = new Date(request.end_date);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });
  };

  const getDateColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-accent/80';
      case 'approved':
        return 'bg-success/80';
      case 'rejected':
        return 'bg-destructive/80';
      default:
        return 'bg-secondary';
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayVacations = getVacationForDate(day);
      const hasVacations = dayVacations.length > 0;

      days.push(
        <div
          key={day}
          className={`aspect-square flex flex-col items-center justify-center text-sm rounded-lg border ${
            hasVacations
              ? `${getDateColor(dayVacations[0].status)} text-white font-semibold`
              : 'bg-background hover:bg-accent/20'
          }`}
        >
          <span>{day}</span>
        </div>
      );
    }

    return days;
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Mis Vacaciones</h2>
          <p className="text-muted-foreground">Gestiona tus solicitudes de vacaciones y consulta tu saldo disponible</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar Vacaciones</DialogTitle>
              <DialogDescription>
                Completa el formulario para solicitar tus días de vacaciones
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha de inicio</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate && !isNaN(startDate.getTime()) ? startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        setStartDate(!isNaN(date.getTime()) ? date : undefined);
                      } else {
                        setStartDate(undefined);
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Fecha de fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate && !isNaN(endDate.getTime()) ? endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value);
                        setEndDate(!isNaN(date.getTime()) ? date : undefined);
                      } else {
                        setEndDate(undefined);
                      }
                    }}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe el motivo de tus vacaciones..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Enviar Solicitud
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vacation Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Días Totales</p>
                <p className="text-2xl font-bold">{vacationBalance?.total_days || 22}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Plane className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Días Usados</p>
                <p className="text-2xl font-bold text-primary">{vacationBalance?.used_days || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Días Disponibles</p>
                <p className="text-2xl font-bold text-success">{vacationBalance?.remaining_days || 22}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vacation Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendario de Vacaciones
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {months[currentMonth]} {currentYear}
              </span>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge className="bg-accent text-white">Pendientes</Badge>
            <Badge className="bg-success text-white">Aprobadas</Badge>
            <Badge className="bg-destructive text-white">Rechazadas</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-[280px]">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center font-semibold text-xs md:text-sm p-2">
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vacation Requests by Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Mis Solicitudes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando solicitudes...</p>
              </div>
            ) : vacationRequests.length === 0 ? (
              <div className="text-center py-8">
                <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes solicitudes de vacaciones</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Haz clic en "Nueva Solicitud" para crear tu primera solicitud
                </p>
              </div>
            ) : (
              requestsByMonth.map(([monthKey, requests]) => {
                const [year, month] = monthKey.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric' 
                });
                
                return (
                  <Collapsible key={monthKey} defaultOpen={monthKey === requestsByMonth[0][0]}>
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Plane className="h-5 w-5 text-primary" />
                              <div className="text-left">
                                <CardTitle className="text-lg capitalize">{monthName}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {requests.length} solicitud{requests.length !== 1 ? 'es' : ''}
                                </p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {requests.map((request) => (
                              <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors gap-3">
                                <div className="flex items-center gap-4">
                                  {getStatusIcon(request.status)}
                                  <div>
                                    <p className="font-medium">
                                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {request.reason || 'Sin motivo especificado'}
                                    </p>
                                    {request.comments && (
                                      <p className="text-sm text-muted-foreground italic mt-1">
                                        Comentarios: {request.comments}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 justify-between sm:justify-end">
                                  <p className="font-semibold text-lg">{request.total_days} días</p>
                                  {getStatusBadge(request.status)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}