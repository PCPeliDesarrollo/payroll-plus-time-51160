import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: {
    id: string;
    date: string;
    check_in_time: string | null;
    check_out_time: string | null;
  };
  onSuccess: () => void;
}

function extractTime(isoString: string | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function EditTimeEntryDialog({ open, onOpenChange, entry, onSuccess }: EditTimeEntryDialogProps) {
  const [checkIn, setCheckIn] = useState(extractTime(entry.check_in_time));
  const [checkOut, setCheckOut] = useState(extractTime(entry.check_out_time));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates: any = {};

      if (checkIn) {
        updates.check_in_time = new Date(`${entry.date}T${checkIn}:00`).toISOString();
      }
      if (checkOut) {
        updates.check_out_time = new Date(`${entry.date}T${checkOut}:00`).toISOString();
      }

      if (checkIn && checkOut) {
        const diffMs = new Date(`${entry.date}T${checkOut}:00`).getTime() - new Date(`${entry.date}T${checkIn}:00`).getTime();
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        updates.total_hours = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        updates.status = 'checked_out';
      }

      const { error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', entry.id);

      if (error) throw error;

      toast({ title: "Fichaje actualizado", description: "Los cambios se han guardado correctamente" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({ title: "Error", description: "No se pudo actualizar el fichaje", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar fichaje - {entry.date}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
