import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useVacationPeriods } from "@/hooks/useVacationPeriods";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface VacationPeriodsCardProps {
  selectedPeriodYear?: number;
  onPeriodChange?: (year: number) => void;
}

export function VacationPeriodsCard({ selectedPeriodYear, onPeriodChange }: VacationPeriodsCardProps) {
  const { periods, loading } = useVacationPeriods();

  // Get current period year
  const now = new Date();
  const currentPeriodYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (periods.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No hay periodos configurados</p>
        </CardContent>
      </Card>
    );
  }

  const selectedPeriod = periods.find(p => p.year === selectedPeriodYear) || periods.find(p => p.year === currentPeriodYear) || periods[0];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">Periodo:</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <Select
              value={String(selectedPeriod?.year || currentPeriodYear)}
              onValueChange={(value) => onPeriodChange?.(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => {
                  const isCurrentPeriod = period.year === currentPeriodYear;
                  return (
                    <SelectItem key={period.id} value={String(period.year)}>
                      <div className="flex items-center gap-2">
                        <span>Periodo {period.year}</span>
                        {isCurrentPeriod && (
                          <Badge variant="default" className="bg-primary text-primary-foreground text-xs ml-1">
                            Actual
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedPeriod && (
              <span className="text-sm text-muted-foreground">
                {formatDate(selectedPeriod.period_start)} → {formatDate(selectedPeriod.period_end)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
