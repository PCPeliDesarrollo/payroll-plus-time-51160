import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react";
import { usePayroll } from "@/hooks/usePayroll";

export function MyPayroll() {
  const { payrollRecords, loading } = usePayroll();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-success text-success-foreground">Aprobada</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-primary text-primary-foreground">Pagada</Badge>;
      default:
        return <Badge variant="outline">Borrador</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Mis Nóminas</h2>
          <p className="text-muted-foreground">Consulta tu historial de nóminas y descargar documentos</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Último Salario</p>
                <p className="text-2xl font-bold">
                  {payrollRecords.length > 0 ? formatCurrency(payrollRecords[0].net_salary) : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Último Período</p>
                <p className="text-2xl font-bold">
                  {payrollRecords.length > 0 
                    ? `${getMonthName(payrollRecords[0].month)} ${payrollRecords[0].year}`
                    : '--'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Total Nóminas</p>
                <p className="text-2xl font-bold">{payrollRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Historial de Nóminas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando nóminas...</p>
              </div>
            ) : payrollRecords.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay nóminas disponibles</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Las nóminas aparecerán aquí cuando el administrador las suba
                </p>
              </div>
            ) : (
              payrollRecords.map((payroll) => (
                <div key={payroll.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Nómina de {getMonthName(payroll.month)} {payroll.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Salario Base: {formatCurrency(payroll.base_salary)} • 
                        Neto: {formatCurrency(payroll.net_salary)}
                      </p>
                      {payroll.overtime_hours > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Horas extra: {payroll.overtime_hours}h
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-2xl">{formatCurrency(payroll.net_salary)}</p>
                      {getStatusBadge(payroll.status)}
                    </div>
                    <div className="flex gap-2">
                      {payroll.file_url ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(payroll.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = payroll.file_url!;
                              link.download = `nomina-${getMonthName(payroll.month)}-${payroll.year}.pdf`;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Archivo no disponible</p>
                          <p className="text-xs text-muted-foreground">Pendiente de subir</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}