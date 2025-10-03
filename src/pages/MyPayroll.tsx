import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download,
  Eye,
  Calendar,
  DollarSign,
  ChevronRight
} from "lucide-react";
import { usePayroll } from "@/hooks/usePayroll";

export function MyPayroll() {
  const { payrollRecords, loading } = usePayroll();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

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

  // Group payroll records by year and month
  const payrollByYear = useMemo(() => {
    const grouped: { [year: number]: { [month: number]: typeof payrollRecords } } = {};
    
    payrollRecords.forEach(record => {
      if (!grouped[record.year]) {
        grouped[record.year] = {};
      }
      if (!grouped[record.year][record.month]) {
        grouped[record.year][record.month] = [];
      }
      grouped[record.year][record.month].push(record);
    });
    
    return grouped;
  }, [payrollRecords]);

  const availableYears = Object.keys(payrollByYear).map(Number).sort((a, b) => b - a);
  const monthsInYear = payrollByYear[selectedYear] || {};
  const availableMonths = Object.keys(monthsInYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Mis Nóminas</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Consulta tu historial de nóminas y descarga documentos</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium leading-none">Último Salario</p>
                <p className="text-xl sm:text-2xl font-bold truncate">
                  {payrollRecords.length > 0 ? formatCurrency(payrollRecords[0].net_salary) : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium leading-none">Último Período</p>
                <p className="text-base sm:text-2xl font-bold truncate">
                  {payrollRecords.length > 0 
                    ? `${getMonthName(payrollRecords[0].month)} ${payrollRecords[0].year}`
                    : '--'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium leading-none">Total Nóminas</p>
                <p className="text-xl sm:text-2xl font-bold">{payrollRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Cargando nóminas...</p>
          </CardContent>
        </Card>
      ) : payrollRecords.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay nóminas disponibles</p>
            <p className="text-sm text-muted-foreground mt-2">
              Las nóminas aparecerán aquí cuando el administrador las suba
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Year Selection */}
          {availableYears.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {availableYears.map(year => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedYear(year);
                    setSelectedMonth(null);
                  }}
                >
                  {year}
                </Button>
              ))}
            </div>
          )}

          {/* Month List or Selected Month Details */}
          {selectedMonth === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {availableMonths.map(month => {
                const monthRecords = monthsInYear[month];
                const latestRecord = monthRecords[0];
                const hasMultiple = monthRecords.length > 1;

                return (
                  <Card 
                    key={month} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary"
                    onClick={() => setSelectedMonth(month)}
                  >
                    <CardHeader className="p-4 sm:p-6 pb-3">
                      <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                        <span>{getMonthName(month)}</span>
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Salario Neto</span>
                          <span className="font-bold text-sm sm:text-base">{formatCurrency(latestRecord.net_salary)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm text-muted-foreground">Estado</span>
                          {getStatusBadge(latestRecord.status)}
                        </div>
                        {hasMultiple && (
                          <Badge variant="outline" className="text-xs w-full justify-center">
                            {monthRecords.length} nóminas
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Nóminas de {getMonthName(selectedMonth)} {selectedYear}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(null)}
                  >
                    Volver
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {monthsInYear[selectedMonth].map((payroll, index) => (
                    <div key={payroll.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base">
                            Nómina {monthsInYear[selectedMonth].length > 1 ? `#${index + 1}` : ''}
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Salario Base: {formatCurrency(payroll.base_salary)}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Neto: {formatCurrency(payroll.net_salary)}
                            </p>
                            {payroll.overtime_hours > 0 && (
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Horas extra: {payroll.overtime_hours}h
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-xl sm:text-2xl">{formatCurrency(payroll.net_salary)}</p>
                          {getStatusBadge(payroll.status)}
                        </div>
                        {payroll.file_url ? (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(payroll.file_url, '_blank')}
                              className="flex-1 sm:flex-none"
                            >
                              <Eye className="h-4 w-4 sm:mr-1" />
                              <span className="sm:inline">Ver</span>
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
                              className="flex-1 sm:flex-none"
                            >
                              <Download className="h-4 w-4 sm:mr-1" />
                              <span className="sm:inline">Descargar</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-left sm:text-center">
                            <p className="text-xs text-muted-foreground">Archivo no disponible</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
