import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RequestExtraHoursDialogProps {
  availableHours: number;
  onRequest: (data: { hours_requested: number; requested_date: string; reason?: string }) => Promise<void>;
}

export function RequestExtraHoursDialog({ availableHours, onRequest }: RequestExtraHoursDialogProps) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Calcular fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hours || !date) {
      toast({
        title: "Error",
        description: "Las horas y la fecha son obligatorias",
        variant: "destructive",
      });
      return;
    }

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast({
        title: "Error",
        description: "Las horas deben ser un número positivo",
        variant: "destructive",
      });
      return;
    }

    if (hoursNum > availableHours) {
      toast({
        title: "Error",
        description: `Solo tienes ${availableHours} horas disponibles`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onRequest({
        hours_requested: hoursNum,
        requested_date: date,
        reason: reason || undefined,
      });
      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de horas extra ha sido enviada correctamente",
      });
      setOpen(false);
      setHours("");
      setDate("");
      setReason("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Clock className="h-4 w-4" />
          Solicitar Horas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Uso de Horas Extra</DialogTitle>
          <DialogDescription>
            Tienes {availableHours.toFixed(1)} horas disponibles. La solicitud debe ser con al menos 1 día de antelación.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hours">Horas a usar</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0.5"
              max={availableHours}
              placeholder="Ej: 2"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Debe ser al menos mañana
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Describe el motivo de tu solicitud..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || availableHours <= 0}>
              {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
