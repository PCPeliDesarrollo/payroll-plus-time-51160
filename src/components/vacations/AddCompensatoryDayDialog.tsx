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
import { useToast } from "@/hooks/use-toast";

interface AddCompensatoryDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onSubmit: (data: { user_id: string; date?: string; reason: string; days_count?: number }) => Promise<void>;
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
  const [daysCount, setDaysCount] = useState("1");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor indica el motivo del día compensatorio",
      });
      return;
    }
    
    const count = parseInt(daysCount);
    if (isNaN(count) || count < 1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La cantidad de días debe ser un número mayor a 0",
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        user_id: employeeId,
        date: date ? format(date, "yyyy-MM-dd") : undefined,
        reason: reason.trim(),
        days_count: count,
      });
      setDate(undefined);
      setReason("");
      setDaysCount("1");
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
          <DialogTitle>Añadir Día Libre Compensatorio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2">
              Empleado: {employeeName}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daysCount">Cantidad de días</Label>
            <Input
              id="daysCount"
              type="number"
              min="1"
              value={daysCount}
              onChange={(e) => setDaysCount(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo del día libre compensatorio (ej: trabajo en festivo, horas extras, etc.)"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha del día libre (opcional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Deja vacío si aún no se ha decidido cuándo se tomará el día libre
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Sin fecha asignada"}
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

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!reason.trim() || loading}>
              {loading ? "Añadiendo..." : "Añadir día libre"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}