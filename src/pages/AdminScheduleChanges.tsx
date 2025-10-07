import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MessageSquare } from 'lucide-react';
import { useScheduleChanges } from '@/hooks/useScheduleChanges';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AdminScheduleChangesProps {
  onBack?: () => void;
}

export default function AdminScheduleChanges({ onBack }: AdminScheduleChangesProps = {}) {
  const { scheduleChanges, loading, updateScheduleChange } = useScheduleChanges();
  const [selectedChange, setSelectedChange] = useState<string | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const handleAction = async () => {
    if (!selectedChange || !actionType) return;

    await updateScheduleChange(
      selectedChange,
      actionType === 'approve' ? 'approved' : 'rejected',
      adminComments
    );

    setSelectedChange(null);
    setAdminComments('');
    setActionType(null);
  };

  const openDialog = (changeId: string, action: 'approve' | 'reject') => {
    setSelectedChange(changeId);
    setActionType(action);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      approved: 'default',
      rejected: 'destructive',
    } as const;

    const colors = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status === 'pending' ? 'Pendiente' : status === 'approved' ? 'Aprobado' : 'Rechazado'}
      </Badge>
    );
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'No especificado';
    return time;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {onBack && (
        <Button variant="outline" onClick={onBack} size="sm">
          ← Volver al Dashboard
        </Button>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cambios de Horario</h1>
          <p className="text-muted-foreground">
            Gestiona las solicitudes de cambio de horario de los empleados
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {scheduleChanges.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No hay solicitudes de cambio de horario
              </p>
            </CardContent>
          </Card>
        ) : (
          scheduleChanges.map((change) => (
            <Card key={change.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">
                        {change.profiles?.full_name || 'Usuario desconocido'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {change.profiles?.department || 'Sin departamento'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(change.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Fecha solicitada</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(change.requested_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Horario actual</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(change.current_check_in)} - {formatTime(change.current_check_out)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Horario solicitado</p>
                      <p className="text-sm font-semibold" style={{ color: '#b062f8' }}>
                        {formatTime(change.requested_check_in)} - {formatTime(change.requested_check_out)}
                      </p>
                    </div>
                  </div>
                </div>

                {change.reason && (
                  <div className="flex gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Motivo</p>
                      <p className="text-sm text-muted-foreground">{change.reason}</p>
                    </div>
                  </div>
                )}

                {change.admin_comments && (
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Comentarios del administrador</p>
                    <p className="text-sm text-muted-foreground">{change.admin_comments}</p>
                  </div>
                )}

                {change.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => openDialog(change.id, 'approve')}
                      className="flex-1"
                    >
                      Aprobar
                    </Button>
                    <Button
                      onClick={() => openDialog(change.id, 'reject')}
                      variant="destructive"
                      className="flex-1"
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedChange} onOpenChange={() => {
        setSelectedChange(null);
        setAdminComments('');
        setActionType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprobar' : 'Rechazar'} cambio de horario
            </DialogTitle>
            <DialogDescription>
              Puedes añadir comentarios adicionales (opcional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comments">Comentarios</Label>
              <Textarea
                id="comments"
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Escribe tus comentarios aquí..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedChange(null);
                setAdminComments('');
                setActionType(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAction}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
