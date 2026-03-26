import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Search, Calendar, ArrowLeft, MapPin, Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ExportDataDialog } from "@/components/admin/ExportDataDialog";
import { AddManualEntryDialog } from "@/components/attendance/AddManualEntryDialog";
import { EditTimeEntryDialog } from "@/components/attendance/EditTimeEntryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimeEntry {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  total_hours: any;
  status: string;
  created_by: string | null;
}

interface Employee {
  id: string;
  full_name: string;
  department: string | null;
}

interface AdminAttendanceProps {
  onBack?: () => void;
}

export function AdminAttendance({ onBack }: AdminAttendanceProps = {}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchTimeEntries(selectedEmployee.id);
    }
  }, [selectedEmployee, selectedMonth]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, department')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeEntries = async (employeeId: string) => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los fichajes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deletingEntryId) return;
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', deletingEntryId);

      if (error) throw error;
      toast({ title: "Fichaje eliminado", description: "El registro se ha eliminado correctamente" });
      setDeletingEntryId(null);
      if (selectedEmployee) fetchTimeEntries(selectedEmployee.id);
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({ title: "Error", description: "No se pudo eliminar el fichaje", variant: "destructive" });
    }
  };

  const openInMap = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <Badge variant="secondary">Fichado</Badge>;
      case 'checked_out':
        return <Badge variant="default">Completado</Badge>;
      default:
        return <Badge variant="outline">Incompleto</Badge>;
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return '-';
    const match = duration.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Vista de lista de empleados
  if (!selectedEmployee) {
    return (
      <div className="space-y-4 md:space-y-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} size="sm">
            ← Volver al Dashboard
          </Button>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Fichajes</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Selecciona un empleado para ver sus fichajes</p>
          </div>
          <ExportDataDialog />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-lg md:text-xl">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                Empleados
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 md:h-10 text-xs md:text-sm"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm md:text-base text-muted-foreground">Cargando empleados...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filteredEmployees.map((employee) => (
                  <Card 
                    key={employee.id} 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <CardContent className="p-4 md:p-6">
                      <p className="font-medium text-base md:text-lg">{employee.full_name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{employee.department || 'Sin departamento'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de fichajes del empleado seleccionado
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:gap-4 px-2 md:px-0">
        <Button 
          variant="outline" 
          onClick={() => {
            setSelectedEmployee(null);
            setTimeEntries([]);
          }}
          className="w-fit text-sm md:text-base"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a empleados
        </Button>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-3xl font-bold text-foreground truncate">
              Fichajes de {selectedEmployee.full_name}
            </h2>
            <p className="text-xs md:text-base text-muted-foreground">
              {selectedEmployee.department || 'Sin departamento'}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 md:h-10 text-xs md:text-sm flex-1 sm:flex-initial"
            />
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Historial de Fichajes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">Cargando fichajes...</p>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm md:text-base text-muted-foreground">
                No hay fichajes registrados para este período
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {timeEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex flex-col p-3 md:p-4 bg-secondary/50 rounded-lg border gap-3"
                >
                  {/* Header row: date + badges + actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-base md:text-lg">
                        {format(new Date(entry.date), "EEEE, d 'de' MMMM", { locale: es })}
                      </p>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {format(new Date(entry.date), 'dd/MM/yyyy')}
                      </span>
                      {entry.created_by && entry.created_by !== entry.user_id && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 text-xs">
                          MANUAL
                        </Badge>
                      )}
                      {getStatusBadge(entry.status)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingEntry(entry)}
                        title="Editar fichaje"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeletingEntryId(entry.id)}
                        title="Eliminar fichaje"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 md:gap-6">
                    <div className="flex-1 min-w-[180px]">
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Entrada</p>
                      <p className="font-medium text-sm md:text-base">{formatTime(entry.check_in_time)}</p>
                      {entry.check_in_latitude && entry.check_in_longitude && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs mt-1"
                          onClick={() => openInMap(entry.check_in_latitude!, entry.check_in_longitude!)}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Ver ubicación
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-[180px]">
                      <p className="text-xs md:text-sm text-muted-foreground mb-1">Salida</p>
                      <p className="font-medium text-sm md:text-base">{formatTime(entry.check_out_time)}</p>
                      {entry.check_out_latitude && entry.check_out_longitude && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs mt-1"
                          onClick={() => openInMap(entry.check_out_latitude!, entry.check_out_longitude!)}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Ver ubicación
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-center min-w-[80px]">
                      <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                      <p className="font-medium text-sm md:text-base">{formatDuration(entry.total_hours)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para añadir fichaje manual */}
      <AddManualEntryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        employeeId={selectedEmployee.id}
        employeeName={selectedEmployee.full_name}
        onSuccess={() => fetchTimeEntries(selectedEmployee.id)}
      />

      {/* Dialog para editar fichaje */}
      {editingEntry && (
        <EditTimeEntryDialog
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          entry={editingEntry}
          onSuccess={() => fetchTimeEntries(selectedEmployee.id)}
        />
      )}

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={(open) => !open && setDeletingEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar fichaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro de fichaje será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
