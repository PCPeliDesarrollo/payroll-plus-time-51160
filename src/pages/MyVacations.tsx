import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Plane
} from "lucide-react";
import { useVacations } from "@/hooks/useVacations";
import { useToast } from "@/hooks/use-toast";

export function MyVacations() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { vacationRequests, vacationBalance, loading, createVacationRequest } = useVacations();
  const { toast } = useToast();

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

      {/* Vacation Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Mis Solicitudes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
              vacationRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.total_days} días • {request.reason || 'Sin motivo especificado'}
                      </p>
                      {request.comments && (
                        <p className="text-sm text-muted-foreground italic mt-1">
                          Comentarios: {request.comments}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{request.total_days} días</p>
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}