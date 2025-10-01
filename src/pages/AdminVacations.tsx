import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface VacationRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: string;
  comments: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    department: string | null;
  } | null;
}

export function AdminVacations() {
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningRequest, setActioningRequest] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  const [comments, setComments] = useState("");
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchVacationRequests();
  }, []);

  const fetchVacationRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *,
          profiles!vacation_requests_user_id_fkey(full_name, department)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVacationRequests(data as any || []);
    } catch (error) {
      console.error('Error fetching vacation requests:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes de vacaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVacationRequest = async (id: string, status: 'approved' | 'rejected', comments: string) => {
    try {
      setActioningRequest(id);

      const { error } = await supabase
        .from('vacation_requests')
        .update({
          status,
          comments,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} correctamente`,
      });

      fetchVacationRequests();
      setSelectedRequest(null);
      setComments("");
      setActionType(null);
    } catch (error) {
      console.error('Error updating vacation request:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la solicitud",
        variant: "destructive",
      });
    } finally {
      setActioningRequest(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazada</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDaysBetween = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const pendingRequests = vacationRequests.filter(req => req.status === 'pending');
  const processedRequests = vacationRequests.filter(req => req.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Gestión de Vacaciones</h2>
        <p className="text-muted-foreground">Aprueba o rechaza las solicitudes de vacaciones</p>
      </div>

      {/* Solicitudes Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Solicitudes Pendientes ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando solicitudes...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{request.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.total_days} días • {request.profiles?.department || 'Sin departamento'}
                      </p>
                      {request.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Motivo: {request.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('reject');
                          }}
                          disabled={actioningRequest === request.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rechazar Solicitud</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>¿Estás seguro de que quieres rechazar la solicitud de vacaciones de <strong>{selectedRequest?.profiles?.full_name}</strong>?</p>
                          <div>
                            <label className="text-sm font-medium">Comentarios (opcional)</label>
                            <Textarea
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              placeholder="Explica el motivo del rechazo..."
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => {
                              setSelectedRequest(null);
                              setComments("");
                              setActionType(null);
                            }}>
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => selectedRequest && updateVacationRequest(selectedRequest.id, 'rejected', comments)}
                              disabled={actioningRequest === selectedRequest?.id}
                            >
                              {actioningRequest === selectedRequest?.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              ) : null}
                              Confirmar Rechazo
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('approve');
                          }}
                          disabled={actioningRequest === request.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aprobar Solicitud</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>¿Estás seguro de que quieres aprobar la solicitud de vacaciones de <strong>{selectedRequest?.profiles?.full_name}</strong>?</p>
                          <div>
                            <label className="text-sm font-medium">Comentarios (opcional)</label>
                            <Textarea
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              placeholder="Añade algún comentario si es necesario..."
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => {
                              setSelectedRequest(null);
                              setComments("");
                              setActionType(null);
                            }}>
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => selectedRequest && updateVacationRequest(selectedRequest.id, 'approved', comments)}
                              disabled={actioningRequest === selectedRequest?.id}
                            >
                              {actioningRequest === selectedRequest?.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              ) : null}
                              Confirmar Aprobación
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solicitudes Procesadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Historial de Solicitudes ({processedRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay solicitudes procesadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{request.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.total_days} días • {request.profiles?.department || 'Sin departamento'}
                      </p>
                      {request.comments && (
                        <div className="flex items-center gap-1 mt-1">
                          <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{request.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Procesada el {formatDate(request.approved_at!)}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
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