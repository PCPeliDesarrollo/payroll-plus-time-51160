import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onSuccess: () => void;
}

export function AddManualEntryDialog({ open, onOpenChange, employeeId, employeeName, onSuccess }: AddManualEntryDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkIn, setCheckIn] = useState("09:00");
  const [checkOut, setCheckOut] = useState("18:00");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const checkInTime = new Date(`${date}T${checkIn}:00`).toISOString();
      const checkOutTime = new Date(`${date}T${checkOut}:00`).toISOString();

      // Calculate total hours
      const diffMs = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const totalHours = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

      const { error } = await supabase.from('time_entries').insert({
        user_id: employeeId,
        date,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        total_hours: totalHours,
        status: 'checked_out',
        created_by: user.id,
      } as any);

      if (error) throw error;

      toast({ title: "Fichaje añadido", description: `Fichaje manual creado para ${employeeName}` });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding manual entry:', error);
      toast({ title: "Error", description: "No se pudo crear el fichaje", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir fichaje manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Empleado: <strong>{employeeName}</strong></p>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hora entrada</Label>
              <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora salida</Label>
              <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
