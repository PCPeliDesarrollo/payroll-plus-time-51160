import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditCompensatoryDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compensatoryDay: {
    id: string;
    date: string;
    reason: string;
  } | null;
  onSubmit: (id: string, data: { date: string; reason: string }) => Promise<void>;
}

export function EditCompensatoryDayDialog({
  open,
  onOpenChange,
  compensatoryDay,
  onSubmit,
}: EditCompensatoryDayDialogProps) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (compensatoryDay) {
      setDate(compensatoryDay.date);
      setReason(compensatoryDay.reason);
    }
  }, [compensatoryDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compensatoryDay) return;

    setIsSubmitting(true);
    try {
      await onSubmit(compensatoryDay.id, { date, reason });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating compensatory day:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Día Libre Compensatorio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-date">Fecha</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-reason">Motivo</Label>
            <Textarea
              id="edit-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo del día libre..."
              required
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
