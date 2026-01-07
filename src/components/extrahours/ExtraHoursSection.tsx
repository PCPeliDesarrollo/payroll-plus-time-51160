import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { ExtraHour, ExtraHoursRequest } from "@/hooks/useExtraHours";
import { AddExtraHoursDialog } from "./AddExtraHoursDialog";
import { RequestExtraHoursDialog } from "./RequestExtraHoursDialog";

interface ExtraHoursSectionProps {
  extraHours: ExtraHour[];
  extraHoursRequests: ExtraHoursRequest[];
  balance: { earned: number; used: number; available: number; earnedDays?: number; availableDays?: number };
  isAdmin: boolean;
  userId?: string;
  onAddHours?: (data: { user_id: string; hours: number; date: string; reason: string }) => Promise<void>;
  onDeleteHours?: (id: string) => Promise<void>;
  onRequestHours?: (data: { hours_requested: number; requested_date: string; reason?: string }) => Promise<void>;
  onApproveRequest?: (id: string) => Promise<void>;
  onRejectRequest?: (id: string) => Promise<void>;
  onDeleteRequest?: (id: string) => Promise<void>;
}

export function ExtraHoursSection({
  extraHours,
  extraHoursRequests,
  balance,
  isAdmin,
  userId,
  onAddHours,
  onDeleteHours,
  onRequestHours,
  onApproveRequest,
  onRejectRequest,
  onDeleteRequest,
}: ExtraHoursSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge className="bg-primary text-primary-foreground">Pendiente</Badge>;
    }
  };

  // Format hours with equivalent days
  const formatHoursWithDays = (hours: number) => {
    const days = Math.floor(hours / 8);
    if (days > 0) {
      return `${hours.toFixed(1)}h (${days} día${days !== 1 ? 's' : ''})`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-4">
      {/* Balance de Horas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Horas Acumuladas</p>
                <p className="text-xl font-bold text-success">{formatHoursWithDays(balance.earned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Horas Usadas</p>
                <p className="text-xl font-bold text-primary">{formatHoursWithDays(balance.used)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Horas Disponibles</p>
                <p className="text-xl font-bold">{formatHoursWithDays(balance.available)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      <div className="flex gap-2 flex-wrap">
        {isAdmin && userId && onAddHours && (
          <AddExtraHoursDialog userId={userId} onAdd={onAddHours} />
        )}
        {!isAdmin && onRequestHours && balance.available > 0 && (
          <RequestExtraHoursDialog availableHours={balance.available} onRequest={onRequestHours} />
        )}
      </div>

      {/* Historial de Horas Ganadas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Horas Extra Acumuladas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {extraHours.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No hay horas extra registradas
            </p>
          ) : (
            <div className="space-y-2">
              {extraHours.map((hour) => (
                <div key={hour.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-success">+{Number(hour.hours).toFixed(1)}h</span>
                      <span className="text-sm text-muted-foreground">{formatDate(hour.date)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{hour.reason}</p>
                  </div>
                  {isAdmin && onDeleteHours && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteHours(hour.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solicitudes de Uso */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Solicitudes de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {extraHoursRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No hay solicitudes de uso
            </p>
          ) : (
            <div className="space-y-2">
              {extraHoursRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{Number(request.hours_requested).toFixed(1)}h</span>
                      <span className="text-sm text-muted-foreground">para {formatDate(request.requested_date)}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.reason && (
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
                    )}
                    {request.admin_comments && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        Admin: {request.admin_comments}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {isAdmin && request.status === 'pending' && (
                      <>
                        {onApproveRequest && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-success hover:text-success"
                            onClick={() => onApproveRequest(request.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {onRejectRequest && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onRejectRequest(request.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    {isAdmin && onDeleteRequest && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDeleteRequest(request.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
