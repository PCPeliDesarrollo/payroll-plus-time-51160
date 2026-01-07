import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { useVacationPeriods } from "@/hooks/useVacationPeriods";

export function VacationPeriodsCard() {
  const { periods, loading } = useVacationPeriods();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get current period year
  const now = new Date();
  const currentPeriodYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Periodos de Vacaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {periods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay periodos configurados</p>
          ) : (
            <div className="grid gap-2">
              {periods.map((period) => {
                const isCurrentPeriod = period.year === currentPeriodYear;
                const isPastPeriod = period.year < currentPeriodYear;
                const isFuturePeriod = period.year > currentPeriodYear;
                
                return (
                  <div 
                    key={period.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border ${
                      isCurrentPeriod 
                        ? 'bg-primary/10 border-primary/30' 
                        : isPastPeriod 
                          ? 'bg-muted/50 border-muted' 
                          : 'bg-card border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 sm:mb-0">
                      <span className="font-medium text-card-foreground">
                        Periodo {period.year}
                      </span>
                      {isCurrentPeriod && (
                        <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                          Actual
                        </Badge>
                      )}
                      {isPastPeriod && (
                        <Badge variant="secondary" className="text-xs">
                          Pasado
                        </Badge>
                      )}
                      {isFuturePeriod && period.year === currentPeriodYear + 1 && (
                        <Badge variant="outline" className="text-xs border-accent text-accent-foreground">
                          Próximo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(period.period_start)}</span>
                      <span>→</span>
                      <span>{formatDate(period.period_end)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
