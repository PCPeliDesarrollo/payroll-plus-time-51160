import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useCompanies } from "@/hooks/useCompanies";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

interface DaySchedule {
  is_working_day: boolean;
  check_in_time: string;
  check_out_time: string;
}

const DEFAULT_SCHEDULES: Record<number, DaySchedule> = {
  1: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  2: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  3: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  4: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  5: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00' },
  6: { is_working_day: false, check_in_time: '09:00', check_out_time: '14:00' },
  0: { is_working_day: false, check_in_time: '09:00', check_out_time: '14:00' },
};

export function CreateCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createCompany } = useCompanies();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    logo_url: '',
  });

  const [schedules, setSchedules] = useState<Record<number, DaySchedule>>({ ...DEFAULT_SCHEDULES });

  const updateSchedule = (day: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedules(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      const company = await createCompany(formData);
      
      // Insert schedules for each day
      const scheduleRows = DAYS_OF_WEEK.map(day => ({
        company_id: company.id,
        day_of_week: day.value,
        is_working_day: schedules[day.value].is_working_day,
        check_in_time: schedules[day.value].check_in_time,
        check_out_time: schedules[day.value].check_out_time,
      }));

      const { error: scheduleError } = await supabase
        .from('company_schedules')
        .insert(scheduleRows);

      if (scheduleError) {
        console.error('Error creating schedules:', scheduleError);
        toast({
          variant: 'destructive',
          title: 'Aviso',
          description: 'Empresa creada pero hubo un error al guardar los horarios',
        });
      }

      setFormData({ name: '', contact_email: '', contact_phone: '', address: '', logo_url: '' });
      setSchedules({ ...DEFAULT_SCHEDULES });
      setOpen(false);
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Empresa</DialogTitle>
          <DialogDescription>
            Completa la información de la empresa y configura sus horarios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Ej: Empresa XYZ S.L."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email de Contacto</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Teléfono</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="+34 XXX XX XX XX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Dirección completa de la empresa"
              rows={2}
            />
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Horarios por Día</Label>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.value} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                  <div className="w-24 font-medium text-sm text-foreground">{day.label}</div>
                  <Switch
                    checked={schedules[day.value].is_working_day}
                    onCheckedChange={(checked) => updateSchedule(day.value, 'is_working_day', checked)}
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {schedules[day.value].is_working_day ? 'Laboral' : 'Libre'}
                  </span>
                  {schedules[day.value].is_working_day && (
                    <>
                      <Input
                        type="time"
                        value={schedules[day.value].check_in_time}
                        onChange={(e) => updateSchedule(day.value, 'check_in_time', e.target.value)}
                        className="w-28 h-8 text-sm"
                      />
                      <span className="text-muted-foreground text-sm">—</span>
                      <Input
                        type="time"
                        value={schedules[day.value].check_out_time}
                        onChange={(e) => updateSchedule(day.value, 'check_out_time', e.target.value)}
                        className="w-28 h-8 text-sm"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? 'Creando...' : 'Crear Empresa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
