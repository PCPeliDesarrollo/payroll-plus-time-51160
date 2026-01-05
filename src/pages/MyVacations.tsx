import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar as CalendarIcon, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Plane,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2
} from "lucide-react";
import { useVacations } from "@/hooks/useVacations";
import { useExtraHours } from "@/hooks/useExtraHours";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExtraHoursSection } from "@/components/extrahours/ExtraHoursSection";

// Helper to get period label (e.g., "2025" for March 2025 - Feb 2026)
const getPeriodLabel = (periodStart: Date): number => {
  return periodStart.getMonth() >= 2 ? periodStart.getFullYear() : periodStart.getFullYear() - 1;
};

// Helper to get period dates from a year label
const getPeriodDates = (year: number): { start: string; end: string } => {
  return {
    start: `${year}-03-01`,
    end: `${year + 1}-02-28`
  };
};

// Generate available periods (current and next)
const getAvailablePeriods = (): number[] => {
  const now = new Date();
  const currentPeriodYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
  return [currentPeriodYear, currentPeriodYear + 1];
};

export function MyVacations() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  
  // Selected period year (e.g., 2025 means March 2025 - Feb 2026)
  const availablePeriods = getAvailablePeriods();
  const [selectedPeriodYear, setSelectedPeriodYear] = useState<number>(availablePeriods[0]);
  
  const { vacationRequests, vacationBalance, loading, createVacationRequest, calculateFuturePeriodBalance, hireDate } = useVacations();
  const { extraHours, extraHoursRequests, balance: extraHoursBalance, requestExtraHours, loading: extraHoursLoading } = useExtraHours();
  const { toast } = useToast();
  
  // Get period dates for the selected period
  const selectedPeriodDates = getPeriodDates(selectedPeriodYear);
  const isCurrentPeriod = selectedPeriodYear === availablePeriods[0];
  
  // Calculate balance for the selected period
  const displayBalance = React.useMemo(() => {
    if (isCurrentPeriod) {
      // For current period, use the actual balance from DB
      return vacationBalance;
    } else {
      // For future periods, calculate based on hire date
      return calculateFuturePeriodBalance(selectedPeriodYear, hireDate);
    }
  }, [isCurrentPeriod, vacationBalance, selectedPeriodYear, hireDate, calculateFuturePeriodBalance]);

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

    // Validar que no haya solapamiento con solicitudes existentes (pendientes o aprobadas)
    const requestedStart = startDate.toISOString().split('T')[0];
    const requestedEnd = endDate.toISOString().split('T')[0];
    
    const overlappingRequests = vacationRequests.filter(req => {
      // Solo considerar solicitudes pendientes o aprobadas
      if (req.status === 'rejected') return false;
      
      const existingStart = req.start_date;
      const existingEnd = req.end_date;
      
      // Verificar si hay solapamiento de fechas
      return (
        (requestedStart >= existingStart && requestedStart <= existingEnd) ||
        (requestedEnd >= existingStart && requestedEnd <= existingEnd) ||
        (requestedStart <= existingStart && requestedEnd >= existingEnd)
      );
    });

    if (overlappingRequests.length > 0) {
      const overlappingDates = overlappingRequests.map(req => 
        `${formatDate(req.start_date)} - ${formatDate(req.end_date)} (${req.status === 'pending' ? 'Pendiente' : 'Aprobada'})`
      ).join('\n');
      
      toast({
        title: "Error: Días ya solicitados",
        description: `Los días que intentas solicitar se solapan con solicitudes existentes:\n${overlappingDates}`,
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
        return <Badge variant="default" className="bg-primary text-primary-foreground">Pendiente</Badge>;
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vacation_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Solicitud eliminada",
        description: "La solicitud de vacaciones ha sido eliminada correctamente",
      });
      
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la solicitud",
      });
    }
  };

  // Filter requests by selected period
  const filteredVacationRequests = React.useMemo(() => {
    return vacationRequests.filter(request => {
      const startDate = request.start_date;
      return startDate >= selectedPeriodDates.start && startDate <= selectedPeriodDates.end;
    });
  }, [vacationRequests, selectedPeriodDates]);

  // Group requests by month (using filtered requests)
  const requestsByMonth = React.useMemo(() => {
    const grouped: Record<string, typeof vacationRequests> = {};
    filteredVacationRequests.forEach(request => {
      const date = new Date(request.start_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(request);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredVacationRequests]);

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
    return filteredVacationRequests.filter(request => {
      const start = request.start_date;
      const end = request.end_date;
      return dateStr >= start && dateStr <= end;
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
          className={`aspect-square flex flex-col items-center justify-center text-[10px] sm:text-xs md:text-sm rounded border sm:rounded-lg ${
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Mis Vacaciones y Horas Extra</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Gestiona tus solicitudes de vacaciones, horas extra y consulta tu saldo disponible</p>
        </div>
      </div>

      <Tabs defaultValue="vacations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vacations" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Vacaciones
          </TabsTrigger>
          <TabsTrigger value="extra-hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horas Extra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vacations" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="sm:inline">Nueva Solicitud</span>
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

      {/* Period Selector */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span className="font-medium text-card-foreground">Periodo Laboral</span>
              </div>
              <Select 
                value={selectedPeriodYear.toString()} 
                onValueChange={(value) => setSelectedPeriodYear(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[280px] bg-card text-card-foreground">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {availablePeriods.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      Periodo Laboral {year} {year === availablePeriods[0] && "(Actual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
              <span className="text-muted-foreground">Fechas del periodo:</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-card text-card-foreground border-primary/30">
                  {new Date(selectedPeriodDates.start).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge variant="outline" className="bg-card text-card-foreground border-primary/30">
                  {new Date(selectedPeriodDates.end).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Badge>
              </div>
            </div>
            {!isCurrentPeriod && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 p-2 rounded">
                ⚠️ Estás viendo el próximo periodo laboral. Puedes solicitar vacaciones anticipadas para este periodo.
              </p>
            )}
            {isCurrentPeriod && (
              <p className="text-xs text-muted-foreground">
                Las vacaciones solo pueden solicitarse dentro de este periodo. Los días no disfrutados no se acumulan al siguiente periodo.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vacation Balance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Días Totales</p>
                <p className="text-2xl font-bold">{displayBalance?.total_days || 22}</p>
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
                <p className="text-2xl font-bold text-primary">{displayBalance?.used_days || 0}</p>
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
                <p className="text-2xl font-bold text-success">{displayBalance?.remaining_days || 22}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Fecha Límite</p>
                <p className="text-lg font-bold text-destructive">
                  {displayBalance?.period_end 
                    ? new Date(displayBalance.period_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    : '28 Feb'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vacation Calendar */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="hidden sm:inline">Calendario de Vacaciones</span>
                <span className="sm:hidden">Calendario</span>
              </CardTitle>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={previousMonth}>
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <span className="text-xs sm:text-sm font-medium min-w-[100px] sm:min-w-[150px] text-center">
                  {months[currentMonth]} {currentYear}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={nextMonth}>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <Badge className="bg-accent text-white text-[10px] sm:text-xs">Pendientes</Badge>
              <Badge className="bg-success text-white text-[10px] sm:text-xs">Aprobadas</Badge>
              <Badge className="bg-destructive text-white text-[10px] sm:text-xs">Rechazadas</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center font-semibold text-[10px] sm:text-xs md:text-sm p-1 sm:p-2">
                {day}
              </div>
            ))}
            {renderCalendar()}
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
            ) : filteredVacationRequests.length === 0 ? (
              <div className="text-center py-8">
                <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes solicitudes de vacaciones en este periodo</p>
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
                                  {(request.status === 'approved' || request.status === 'rejected') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(request.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
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
        </TabsContent>

        <TabsContent value="extra-hours" className="space-y-6 mt-6">
          <ExtraHoursSection
            extraHours={extraHours}
            extraHoursRequests={extraHoursRequests}
            balance={extraHoursBalance}
            isAdmin={false}
            onRequestHours={requestExtraHours}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}