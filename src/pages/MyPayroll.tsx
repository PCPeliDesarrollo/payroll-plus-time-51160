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
import { useTimeEntries } from "@/hooks/useTimeEntries";

export function MyPayroll() {
  const { payrollRecords, loading } = usePayroll();
  const { timeEntries } = useTimeEntries();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Calculate company seniority from first time entry
  const getCompanySeniority = () => {
    if (timeEntries.length === 0) return '--';
    
    // Get the oldest time entry (last in the array since it's ordered desc)
    const firstEntry = timeEntries[timeEntries.length - 1];
    const firstDate = new Date(firstEntry.date);
    const now = new Date();
    
    const years = now.getFullYear() - firstDate.getFullYear();
    const months = now.getMonth() - firstDate.getMonth();
    
    let totalMonths = years * 12 + months;
    if (totalMonths < 0) totalMonths = 0;
    
    const displayYears = Math.floor(totalMonths / 12);
    const displayMonths = totalMonths % 12;
    
    if (displayYears === 0) {
      return `${displayMonths} ${displayMonths === 1 ? 'mes' : 'meses'}`;
    } else if (displayMonths === 0) {
      return `${displayYears} ${displayYears === 1 ? 'año' : 'años'}`;
    } else {
      return `${displayYears} ${displayYears === 1 ? 'año' : 'años'} y ${displayMonths} ${displayMonths === 1 ? 'mes' : 'meses'}`;
    }
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium leading-none">Antigüedad en la Empresa</p>
                <p className="text-base sm:text-xl font-bold truncate">
                  {getCompanySeniority()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
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
                          <span className="text-xs sm:text-sm text-muted-foreground">Estado</span>
                          {getStatusBadge(latestRecord.status)}
                        </div>
                        {hasMultiple && (
                          <Badge variant="outline" className="text-xs w-full justify-center mt-2">
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
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {getMonthName(payroll.month)} {payroll.year}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Para ver los detalles de salario, descarga el PDF
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-3">
                        <div className="text-left">
                          {getStatusBadge(payroll.status)}
                        </div>
                        {payroll.file_url ? (
                          <div className="flex gap-2 w-full">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(payroll.file_url, '_blank')}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver PDF
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
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </Button>
                          </div>
                        ) : (
                          <div className="text-left">
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
