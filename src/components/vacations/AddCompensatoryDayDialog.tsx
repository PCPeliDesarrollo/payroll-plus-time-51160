import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddCompensatoryDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onSubmit: (data: { user_id: string; date: string; reason: string }) => Promise<void>;
}

export function AddCompensatoryDayDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  onSubmit,
}: AddCompensatoryDayDialogProps) {
  const [date, setDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        user_id: employeeId,
        date: format(date, "yyyy-MM-dd"),
        reason: reason.trim(),
      });
      setDate(undefined);
      setReason("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding compensatory day:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir día libre compensatorio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2">
              Empleado: {employeeName}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha del día libre</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Día libre por horas extras trabajadas el 15/01/2025"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!date || !reason.trim() || loading}>
              {loading ? "Añadiendo..." : "Añadir día libre"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
