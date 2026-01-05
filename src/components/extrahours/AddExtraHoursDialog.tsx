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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddExtraHoursDialogProps {
  userId: string;
  onAdd: (data: { user_id: string; hours: number; date: string; reason: string }) => Promise<void>;
}

export function AddExtraHoursDialog({ userId, onAdd }: AddExtraHoursDialogProps) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hours || !date || !reason) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
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

    setIsSubmitting(true);
    try {
      await onAdd({
        user_id: userId,
        hours: hoursNum,
        date,
        reason,
      });
      toast({
        title: "Horas añadidas",
        description: `Se han añadido ${hoursNum} horas extra correctamente`,
      });
      setOpen(false);
      setHours("");
      setReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron añadir las horas extra",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Añadir Horas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Horas Extra</DialogTitle>
          <DialogDescription>
            Registra horas extra trabajadas por el empleado
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hours">Horas</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0.5"
              placeholder="Ej: 2.5"
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
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              placeholder="Describe el motivo de las horas extra..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Añadiendo..." : "Añadir Horas"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
