import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, Eye, Download, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface PayrollRecord {
  id: string;
  user_id: string;
  month: number;
  year: number;
  base_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  deductions: number;
  bonuses: number;
  net_salary: number;
  status: string;
  file_url: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    department: string | null;
  } | null;
}

interface Employee {
  id: string;
  full_name: string;
  department: string | null;
}

interface AdminPayrollProps {
  onBack?: () => void;
}

export function AdminPayroll({ onBack }: AdminPayrollProps = {}) {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [pendingPayrollByEmployee, setPendingPayrollByEmployee] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [newPayroll, setNewPayroll] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchPayrollRecords();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchPendingPayrollCounts();
    }
  }, [employees]);

  const fetchPendingPayrollCounts = async () => {
    try {
      const counts: Record<string, number> = {};
      for (const employee of employees) {
        const { data, error } = await supabase
          .from('payroll_records')
          .select('id')
          .eq('user_id', employee.id)
          .eq('status', 'draft');

        if (!error && data) {
          counts[employee.id] = data.length;
        }
      }
      setPendingPayrollByEmployee(counts);
    } catch (error) {
      console.error('Error fetching pending payroll counts:', error);
    }
  };

  const fetchPayrollRecords = async (employeeId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('payroll_records')
        .select(`
          *,
          profiles!payroll_records_user_id_fkey(full_name, department)
        `);
      
      if (employeeId) {
        query = query.eq('user_id', employeeId);
      }
      
      const { data, error } = await query
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setPayrollRecords(data as any || []);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las nóminas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, department')
        .eq('is_active', true);

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const deletePayrollRecord = async (recordId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nómina? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Primero eliminar el archivo del storage si existe
      const record = payrollRecords.find(r => r.id === recordId);
      if (record?.file_url) {
        const fileName = record.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('payroll-files')
            .remove([fileName]);
        }
      }

      // Eliminar el registro de la base de datos
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Nómina eliminada correctamente",
      });

      fetchPayrollRecords(selectedEmployee?.id);
      if (selectedEmployee) {
        fetchPendingPayrollCounts();
      }
    } catch (error: any) {
      console.error('Error deleting payroll:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la nómina",
        variant: "destructive",
      });
    }
  };

  const createPayrollRecord = async () => {
    if (!selectedEmployee) return;
    
    try {
      // Verificar si ya existe una nómina para este usuario, mes y año
      const { data: existingRecord } = await supabase
        .from('payroll_records')
        .select('id')
        .eq('user_id', selectedEmployee.id)
        .eq('month', newPayroll.month)
        .eq('year', newPayroll.year)
        .single();

      if (existingRecord) {
        toast({
          title: "Error",
          description: `Ya existe una nómina para ${getMonthName(newPayroll.month)} ${newPayroll.year}`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('payroll_records')
        .insert([{
          user_id: selectedEmployee.id,
          month: newPayroll.month,
          year: newPayroll.year,
          base_salary: 0,
          overtime_hours: 0,
          overtime_rate: 0,
          deductions: 0,
          bonuses: 0,
          net_salary: 0,
          status: 'draft',
          company_id: profile?.company_id,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Registro de nómina creado. Ahora sube el archivo PDF.",
      });

      setIsCreateDialogOpen(false);
      setNewPayroll({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      fetchPayrollRecords(selectedEmployee.id);
      if (selectedEmployee) {
        fetchPendingPayrollCounts();
      }
    } catch (error) {
      console.error('Error creating payroll record:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la nómina",
        variant: "destructive",
      });
    }
  };

  const uploadPayrollFile = async (file: File, recordId: string) => {
    try {
      setUploadingFile(recordId);

      // Validar que sea un PDF
      if (file.type !== 'application/pdf') {
        throw new Error('Solo se permiten archivos PDF');
      }

      const fileExt = 'pdf';
      const fileName = `${recordId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Primero eliminar archivo anterior si existe
      const record = payrollRecords.find(r => r.id === recordId);
      if (record?.file_url) {
        const oldPath = record.file_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('payroll-files')
            .remove([oldPath]);
        }
      }

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payroll-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('payroll-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('payroll_records')
        .update({ 
          file_url: publicUrl,
          status: 'approved' 
        })
        .eq('id', recordId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Éxito",
        description: "Nómina subida correctamente",
      });

      fetchPayrollRecords(selectedEmployee?.id);
      fetchPendingPayrollCounts();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el archivo. Verifica que sea un PDF válido.",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Aprobada</Badge>;
      case 'paid':
        return <Badge className="bg-success text-success-foreground">Pagada</Badge>;
      case 'draft':
        return <Badge variant="outline">Borrador</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };

  // Filtrar empleados por búsqueda
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
        <div className="px-2 md:px-0">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Nóminas</h2>
          <p className="text-sm md:text-base text-muted-foreground">Selecciona un empleado para ver sus nóminas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-lg md:text-xl">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
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
                <FileText className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filteredEmployees.map((employee) => {
                  const pendingCount = pendingPayrollByEmployee[employee.id] || 0;
                  return (
                    <Card 
                      key={employee.id} 
                      className="cursor-pointer hover:bg-accent transition-colors relative"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        fetchPayrollRecords(employee.id);
                      }}
                    >
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base md:text-lg">{employee.full_name}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">{employee.department || 'Sin departamento'}</p>
                          </div>
                          {pendingCount > 0 && (
                            <Badge variant="secondary" className="bg-warning/20 text-warning-foreground ml-2">
                              {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de nóminas del empleado seleccionado
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:gap-4 px-2 md:px-0">
        <Button 
          variant="outline" 
          onClick={() => {
            setSelectedEmployee(null);
            setPayrollRecords([]);
          }}
          className="w-fit text-sm md:text-base"
          size="sm"
        >
          ← Volver a empleados
        </Button>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-3xl font-bold text-foreground truncate">Nóminas de {selectedEmployee.full_name}</h2>
            <p className="text-xs md:text-base text-muted-foreground">{selectedEmployee.department || 'Sin departamento'}</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm">Nueva Nómina</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-base md:text-lg">Crear Nueva Nómina para {selectedEmployee.full_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                  <p className="text-xs md:text-sm text-blue-800">
                    <strong>Flujo simplificado:</strong> Selecciona el período y después sube el archivo PDF de la nómina.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="month" className="text-xs md:text-sm">Mes</Label>
                    <Select value={newPayroll.month.toString()} onValueChange={(value) => setNewPayroll({...newPayroll, month: parseInt(value)})}>
                      <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 12}, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()} className="text-xs md:text-sm">
                            {getMonthName(i + 1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="year" className="text-xs md:text-sm">Año</Label>
                    <Input
                      type="number"
                      value={newPayroll.year}
                      onChange={(e) => setNewPayroll({...newPayroll, year: parseInt(e.target.value)})}
                      className="h-9 md:h-10 text-xs md:text-sm"
                    />
                  </div>
                </div>

                <Button onClick={createPayrollRecord} className="w-full text-xs md:text-sm h-9 md:h-10">
                  Crear Nómina (después subir PDF)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Historial de Nóminas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">Cargando nóminas...</p>
            </div>
          ) : payrollRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm md:text-base text-muted-foreground">No hay nóminas registradas para este empleado</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {payrollRecords.map((record) => (
                <div key={record.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 bg-secondary/50 rounded-lg border">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-base md:text-lg">{getMonthName(record.month)} {record.year}</p>
                    <div className="text-xs md:text-sm">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                  
                   <div className="flex flex-wrap gap-2">
                    {record.file_url ? (
                      <>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => {
                             console.log('Opening file:', record.file_url);
                             const url = record.file_url + '?t=' + Date.now();
                             window.open(url, '_blank', 'noopener,noreferrer');
                           }}
                           className="flex-1 sm:flex-none text-xs md:text-sm h-8 md:h-9"
                         >
                           <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                           Ver
                         </Button>
                         <a
                           href={record.file_url}
                           download={`nomina-${selectedEmployee.full_name}-${getMonthName(record.month)}-${record.year}.pdf`}
                           target="_blank"
                           rel="noopener noreferrer"
                         >
                           <Button
                             size="sm"
                             variant="outline"
                             className="flex-1 sm:flex-none text-xs md:text-sm h-8 md:h-9"
                           >
                             <Download className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                             Descargar
                           </Button>
                         </a>
                         <Button
                           size="sm"
                           variant="destructive"
                           onClick={() => deletePayrollRecord(record.id)}
                           className="flex-1 sm:flex-none text-xs md:text-sm h-8 md:h-9"
                         >
                           <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                           Eliminar
                         </Button>
                      </>
                    ) : (
                      <div className="w-full sm:w-auto">
                        <input
                          type="file"
                          id={`file-${record.id}`}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadPayrollFile(file, record.id);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => document.getElementById(`file-${record.id}`)?.click()}
                          disabled={uploadingFile === record.id}
                          className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-9"
                        >
                          {uploadingFile === record.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-primary mr-1" />
                          ) : (
                            <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          )}
                          Subir PDF
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}