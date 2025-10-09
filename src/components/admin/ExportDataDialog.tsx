import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function ExportDataDialog() {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<'attendance' | 'vacations' | 'schedule_changes'>('attendance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Debes seleccionar las fechas de inicio y fin",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      let data: any[] = [];
      let filename = '';
      let headers: string[] = [];

      if (exportType === 'attendance') {
        const { data: entries, error } = await supabase
          .from('time_entries')
          .select(`
            *,
            profiles:user_id (full_name, employee_id, department)
          `)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        if (error) throw error;

        data = entries || [];
        filename = `fichajes_${startDate}_${endDate}.csv`;
        headers = [
          'Fecha',
          'Empleado',
          'ID Empleado',
          'Departamento',
          'Hora Entrada',
          'Ubicación Entrada',
          'Hora Salida',
          'Ubicación Salida',
          'Total Horas',
          'Estado'
        ];
      } else if (exportType === 'vacations') {
        const { data: requests, error } = await supabase
          .from('vacation_requests')
          .select(`
            *,
            profiles:user_id (full_name, employee_id, department)
          `)
          .gte('start_date', startDate)
          .lte('end_date', endDate)
          .order('start_date', { ascending: false });

        if (error) throw error;

        data = requests || [];
        filename = `vacaciones_${startDate}_${endDate}.csv`;
        headers = [
          'Empleado',
          'ID Empleado',
          'Departamento',
          'Fecha Inicio',
          'Fecha Fin',
          'Días Totales',
          'Estado',
          'Motivo',
          'Comentarios',
          'Fecha Solicitud'
        ];
      } else if (exportType === 'schedule_changes') {
        const { data: changes, error } = await supabase
          .from('schedule_changes')
          .select(`
            *,
            profiles:user_id (full_name, employee_id, department)
          `)
          .gte('requested_date', startDate)
          .lte('requested_date', endDate)
          .order('requested_date', { ascending: false });

        if (error) throw error;

        data = changes || [];
        filename = `cambios_horario_${startDate}_${endDate}.csv`;
        headers = [
          'Empleado',
          'ID Empleado',
          'Departamento',
          'Fecha',
          'Horario Actual Entrada',
          'Horario Actual Salida',
          'Horario Solicitado Entrada',
          'Horario Solicitado Salida',
          'Motivo',
          'Estado',
          'Comentarios Admin'
        ];
      }

      // Generar CSV
      const csvContent = generateCSV(data, headers, exportType);
      
      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      toast({
        title: "Exportación completada",
        description: `Se han exportado ${data.length} registros correctamente`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo exportar los datos",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (data: any[], headers: string[], type: string): string => {
    const rows: string[][] = [headers];

    data.forEach((item) => {
      let row: string[] = [];

      if (type === 'attendance') {
        const profile = item.profiles || {};
        const checkInLocation = item.check_in_latitude && item.check_in_longitude
          ? `${item.check_in_latitude}, ${item.check_in_longitude}`
          : 'No disponible';
        const checkOutLocation = item.check_out_latitude && item.check_out_longitude
          ? `${item.check_out_latitude}, ${item.check_out_longitude}`
          : 'No disponible';
        
        row = [
          item.date || '',
          profile.full_name || '',
          profile.employee_id || '',
          profile.department || '',
          item.check_in_time ? format(new Date(item.check_in_time), 'HH:mm:ss') : '',
          checkInLocation,
          item.check_out_time ? format(new Date(item.check_out_time), 'HH:mm:ss') : '',
          checkOutLocation,
          item.total_hours || '',
          item.status || ''
        ];
      } else if (type === 'vacations') {
        const profile = item.profiles || {};
        row = [
          profile.full_name || '',
          profile.employee_id || '',
          profile.department || '',
          item.start_date || '',
          item.end_date || '',
          item.total_days?.toString() || '',
          item.status || '',
          item.reason || '',
          item.comments || '',
          item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : ''
        ];
      } else if (type === 'schedule_changes') {
        const profile = item.profiles || {};
        row = [
          profile.full_name || '',
          profile.employee_id || '',
          profile.department || '',
          item.requested_date || '',
          item.current_check_in || '',
          item.current_check_out || '',
          item.requested_check_in || '',
          item.requested_check_out || '',
          item.reason || '',
          item.status || '',
          item.admin_comments || ''
        ];
      }

      rows.push(row);
    });

    return rows.map(row => 
      row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Datos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Datos a CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export-type">Tipo de datos</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger id="export-type">
                <SelectValue placeholder="Selecciona el tipo de datos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance">Fichajes</SelectItem>
                <SelectItem value="vacations">Vacaciones</SelectItem>
                <SelectItem value="schedule_changes">Cambios de Horario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isExporting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 gap-2"
            >
              {isExporting ? (
                "Exportando..."
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
