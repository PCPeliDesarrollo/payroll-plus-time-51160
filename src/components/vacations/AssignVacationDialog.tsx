import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onDone: () => void;
}

export function AssignVacationDialog({ open, onOpenChange, employeeId, employeeName, onDone }: Props) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const days = start && end ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1 : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end || days < 1) {
      toast({ variant: "destructive", title: "Error", description: "Revisa las fechas: la fecha fin no puede ser anterior a la de inicio" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from("vacation_requests").insert({
        user_id: employeeId,
        start_date: start,
        end_date: end,
        total_days: days,
        reason: reason.trim() || "Vacaciones registradas por el administrador",
        status: "pending",
        request_type: "full_day",
      }).select("id").single();
      if (error) throw error;
      const { error: upErr } = await supabase.from("vacation_requests").update({
        status: "approved", approved_by: user?.id, approved_at: new Date().toISOString(),
      }).eq("id", data.id);
      if (upErr) throw upErr;
      toast({ title: "Vacaciones registradas", description: `${days} día(s) asignados a ${employeeName}` });
      setStart(""); setEnd(""); setReason("");
      onOpenChange(false);
      onDone();
    } catch (err: any) {
      toast({ variant: "destructive", title: "No se pudieron registrar", description: err?.message || "Error desconocido" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar vacaciones a {employeeName}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="av-start">Fecha inicio</Label>
              <Input id="av-start" type="date" value={start} onChange={(e) => { setStart(e.target.value); if (!end) setEnd(e.target.value); }} required /></div>
            <div className="space-y-2"><Label htmlFor="av-end">Fecha fin</Label>
              <Input id="av-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} required /></div>
          </div>
          {days > 0 && <p className="text-sm text-muted-foreground">Total: {days} día(s). Se descontarán de su saldo y quedarán aprobadas.</p>}
          <div className="space-y-2"><Label htmlFor="av-reason">Motivo (opcional)</Label>
            <Textarea id="av-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Registrar vacaciones"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
