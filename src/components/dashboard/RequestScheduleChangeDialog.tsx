import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useScheduleChanges } from '@/hooks/useScheduleChanges';
import { useAuth } from '@/hooks/useAuth';

export function RequestScheduleChangeDialog() {
  const { user } = useAuth();
  const { createScheduleChange } = useScheduleChanges();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [currentCheckIn, setCurrentCheckIn] = useState('');
  const [currentCheckOut, setCurrentCheckOut] = useState('');
  const [requestedCheckIn, setRequestedCheckIn] = useState('');
  const [requestedCheckOut, setRequestedCheckOut] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!user || !date) return;

    await createScheduleChange({
      user_id: user.id,
      requested_date: format(date, 'yyyy-MM-dd'),
      current_check_in: currentCheckIn || null,
      current_check_out: currentCheckOut || null,
      requested_check_in: requestedCheckIn || null,
      requested_check_out: requestedCheckOut || null,
      reason: reason || null,
    });

    // Reset form
    setDate(undefined);
    setCurrentCheckIn('');
    setCurrentCheckOut('');
    setRequestedCheckIn('');
    setRequestedCheckOut('');
    setReason('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Clock className="mr-2 h-4 w-4" />
          Solicitar Cambio de Horario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Cambio de Horario</DialogTitle>
          <DialogDescription>
            Completa el formulario para solicitar un cambio en tu horario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Fecha del cambio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: es }) : 'Selecciona una fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={es}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Horario actual</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="current-in" className="text-xs text-muted-foreground">
                  Entrada
                </Label>
                <Input
                  id="current-in"
                  type="time"
                  value={currentCheckIn}
                  onChange={(e) => setCurrentCheckIn(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="current-out" className="text-xs text-muted-foreground">
                  Salida
                </Label>
                <Input
                  id="current-out"
                  type="time"
                  value={currentCheckOut}
                  onChange={(e) => setCurrentCheckOut(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Horario solicitado</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="requested-in" className="text-xs text-muted-foreground">
                  Entrada
                </Label>
                <Input
                  id="requested-in"
                  type="time"
                  value={requestedCheckIn}
                  onChange={(e) => setRequestedCheckIn(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="requested-out" className="text-xs text-muted-foreground">
                  Salida
                </Label>
                <Input
                  id="requested-out"
                  type="time"
                  value={requestedCheckOut}
                  onChange={(e) => setRequestedCheckOut(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica el motivo del cambio de horario..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!date}>
            Enviar Solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
