import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useScheduleChanges } from "@/hooks/useScheduleChanges";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function MyScheduleChanges() {
  const { scheduleChanges, loading } = useScheduleChanges();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Pendiente</Badge>;
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
      <div>
        <h2 className="text-3xl font-bold text-foreground">Mis Cambios de Horario</h2>
        <p className="text-muted-foreground">Consulta el estado de tus solicitudes de cambio de horario</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Solicitudes de Cambio de Horario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando solicitudes...</p>
              </div>
            ) : scheduleChanges.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes solicitudes de cambio de horario</p>
              </div>
            ) : (
              scheduleChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors gap-3"
                >
                  <div className="flex items-start gap-4">
                    {getStatusIcon(change.status)}
                    <div>
                      <p className="font-medium">
                        {format(new Date(change.requested_date), 'dd MMMM yyyy', { locale: es })}
                      </p>
                      <div className="text-sm text-muted-foreground mt-1">
                        {change.current_check_in && (
                          <p>Horario actual: {change.current_check_in} - {change.current_check_out || 'Sin salida'}</p>
                        )}
                        <p className="font-medium" style={{ color: '#b062f8' }}>
                          Horario solicitado: {change.requested_check_in} - {change.requested_check_out || 'Sin salida'}
                        </p>
                      </div>
                      {change.reason && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Motivo:</strong> {change.reason}
                        </p>
                      )}
                      {change.admin_comments && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          <strong>Comentarios del admin:</strong> {change.admin_comments}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {getStatusBadge(change.status)}
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
