import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, Eye, Download, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export function AdminPayroll() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const { toast } = useToast();

  const [newPayroll, setNewPayroll] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchPayrollRecords();
    fetchEmployees();
  }, []);

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
          status: 'draft'
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

      const fileExt = file.name.split('.').pop();
      const fileName = `${recordId}-${Date.now()}.${fileExt}`;
      const filePath = `payroll/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payroll-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payroll-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('payroll_records')
        .update({ 
          file_url: publicUrl,
          status: 'completed' 
        })
        .eq('id', recordId);

      if (updateError) throw updateError;

      toast({
        title: "Éxito",
        description: "Archivo subido correctamente",
      });

      fetchPayrollRecords(selectedEmployee?.id);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completada</Badge>;
      case 'draft':
        return <Badge variant="secondary">Borrador</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };

  // Vista de lista de empleados
  if (!selectedEmployee) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Gestión de Nóminas</h2>
          <p className="text-muted-foreground">Selecciona un empleado para ver sus nóminas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando empleados...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay empleados registrados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((employee) => (
                  <Card 
                    key={employee.id} 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      fetchPayrollRecords(employee.id);
                    }}
                  >
                    <CardContent className="p-6">
                      <p className="font-medium text-lg">{employee.full_name}</p>
                      <p className="text-sm text-muted-foreground">{employee.department || 'Sin departamento'}</p>
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

  // Vista de nóminas del empleado seleccionado
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedEmployee(null);
              setPayrollRecords([]);
            }}
            className="mb-2"
          >
            ← Volver a empleados
          </Button>
          <h2 className="text-3xl font-bold text-foreground">Nóminas de {selectedEmployee.full_name}</h2>
          <p className="text-muted-foreground">{selectedEmployee.department || 'Sin departamento'}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Nómina
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Nómina para {selectedEmployee.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Flujo simplificado:</strong> Selecciona el período y después sube el archivo PDF de la nómina.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">Mes</Label>
                  <Select value={newPayroll.month.toString()} onValueChange={(value) => setNewPayroll({...newPayroll, month: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {getMonthName(i + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="year">Año</Label>
                  <Input
                    type="number"
                    value={newPayroll.year}
                    onChange={(e) => setNewPayroll({...newPayroll, year: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <Button onClick={createPayrollRecord} className="w-full">
                Crear Nómina (después subir PDF)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Historial de Nóminas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando nóminas...</p>
            </div>
          ) : payrollRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay nóminas registradas para este empleado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payrollRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-lg">{getMonthName(record.month)} {record.year}</p>
                      <p className="text-sm text-muted-foreground">
                        {getStatusBadge(record.status)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {record.file_url ? (
                      <div className="flex gap-2">
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => {
                             console.log('Opening file:', record.file_url);
                             const url = record.file_url + '?t=' + Date.now();
                             window.open(url, '_blank', 'noopener,noreferrer');
                           }}
                         >
                           <Eye className="h-4 w-4 mr-1" />
                           Ver
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={async () => {
                             try {
                               console.log('Downloading file:', record.file_url);
                               const fileName = `nomina-${selectedEmployee.full_name}-${getMonthName(record.month)}-${record.year}.pdf`;
                               
                               const response = await fetch(record.file_url!, {
                                 method: 'GET',
                                 headers: {
                                   'Content-Type': 'application/pdf',
                                 },
                               });
                               
                               if (!response.ok) {
                                 throw new Error('Error al descargar el archivo');
                               }
                               
                               const blob = await response.blob();
                               const url = window.URL.createObjectURL(blob);
                               
                               const link = document.createElement('a');
                               link.href = url;
                               link.download = fileName;
                               document.body.appendChild(link);
                               link.click();
                               document.body.removeChild(link);
                               window.URL.revokeObjectURL(url);
                             } catch (error) {
                               console.error('Error downloading file:', error);
                               toast({
                                 title: "Error",
                                 description: "No se pudo descargar el archivo",
                                 variant: "destructive",
                               });
                             }
                           }}
                         >
                           <Download className="h-4 w-4 mr-1" />
                           Descargar
                         </Button>
                      </div>
                    ) : (
                      <div>
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
                        >
                          {uploadingFile === record.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-1" />
                          ) : (
                            <Upload className="h-4 w-4 mr-1" />
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