import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportAttendancePDF, exportVacationsPDF, exportScheduleChangesPDF } from "@/lib/pdfExport";

interface Employee {
  id: string;
  full_name: string;
  employee_id: string | null;
}

export function ExportDataDialog() {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<'attendance' | 'vacations' | 'schedule_changes'>('attendance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && exportType === 'attendance') {
      fetchEmployees();
    }
  }, [open, exportType]);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, employee_id')
      .eq('is_active', true)
      .order('full_name');
    setEmployees(data || []);
  };

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
      if (exportType === 'attendance') {
        let query = supabase
          .from('time_entries')
          .select(`*, profiles:user_id (full_name, employee_id, department)`)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        if (selectedEmployee !== 'all') {
          query = query.eq('user_id', selectedEmployee);
        }

        const { data, error } = await query;
        if (error) throw error;

        const employeeName = selectedEmployee !== 'all'
          ? employees.find(e => e.id === selectedEmployee)?.full_name
          : undefined;

        exportAttendancePDF(data || [], startDate, endDate, employeeName);
      } else if (exportType === 'vacations') {
        const { data, error } = await supabase
          .from('vacation_requests')
          .select(`*, profiles:user_id (full_name, employee_id, department)`)
          .gte('start_date', startDate)
          .lte('end_date', endDate)
          .order('start_date', { ascending: false });
        if (error) throw error;
        exportVacationsPDF(data || [], startDate, endDate);
      } else if (exportType === 'schedule_changes') {
        const { data, error } = await supabase
          .from('schedule_changes')
          .select(`*, profiles:user_id (full_name, employee_id, department)`)
          .gte('requested_date', startDate)
          .lte('requested_date', endDate)
          .order('requested_date', { ascending: false });
        if (error) throw error;
        exportScheduleChangesPDF(data || [], startDate, endDate);
      }

      toast({
        title: "PDF generado",
        description: "El informe se ha descargado correctamente",
      });
      setOpen(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el informe PDF",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Exportar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Informe PDF</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export-type">Tipo de datos</Label>
            <Select value={exportType} onValueChange={(value: any) => { setExportType(value); setSelectedEmployee('all'); }}>
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

          {exportType === 'attendance' && (
            <div className="space-y-2">
              <Label htmlFor="employee-select">Empleado</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder="Selecciona empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} {emp.employee_id ? `(${emp.employee_id})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                "Generando..."
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
