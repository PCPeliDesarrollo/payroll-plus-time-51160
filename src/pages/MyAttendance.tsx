import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Download,
  Play,
  Square,
  MoreVertical,
  Flag
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export function MyAttendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const { timeEntries, currentEntry, loading, isCheckedIn, checkIn, checkOut } = useTimeEntries();
  const { toast } = useToast();

  // Group entries by month
  const entriesByMonth = React.useMemo(() => {
    const grouped: Record<string, typeof timeEntries> = {};
    timeEntries.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(entry);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [timeEntries]);

  // Update time and elapsed time every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      
      if (isCheckedIn && currentEntry?.check_in_time) {
        const checkInTime = new Date(currentEntry.check_in_time).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - checkInTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn, currentEntry]);

  const handleCheckInOut = async () => {
    try {
      if (isCheckedIn) {
        await checkOut();
        toast({
          title: "¡Fichaje de salida registrado!",
          description: "Has fichado la salida correctamente.",
        });
      } else {
        await checkIn();
        toast({
          title: "¡Fichaje de entrada registrado!",
          description: "Has fichado la entrada correctamente.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error al fichar",
        description: error.message || "Hubo un problema al registrar el fichaje.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (duration: string) => {
    // Parse PostgreSQL interval format (e.g., "08:30:00")
    const parts = duration.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  return (
    <div className="space-y-6">
      {/* Check In/Out Card - Arriba del todo */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <div className="text-5xl font-bold">{currentTime}</div>
              <div className="text-white/90 text-sm">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <div className="space-y-3">
              {isCheckedIn && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 space-y-2">
                  <Badge className="bg-white text-primary font-semibold">
                    ✓ FICHADO
                  </Badge>
                  <div className="text-3xl font-bold">{elapsedTime}</div>
                  <p className="text-sm text-white/90">
                    Entrada: {currentEntry?.check_in_time ? new Date(currentEntry.check_in_time).toLocaleTimeString('es-ES') : '--'}
                  </p>
                </div>
              )}

              <Button
                onClick={handleCheckInOut}
                size="lg"
                className={`h-16 px-8 text-lg font-semibold w-full ${
                  isCheckedIn 
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                    : "bg-white hover:bg-white/90 text-primary"
                }`}
              >
                {isCheckedIn ? (
                  <>
                    <Square className="mr-2 h-6 w-6" />
                    Fichar Salida
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-6 w-6" />
                    Fichar Entrada
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Mis Fichajes</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Consulta tu historial de fichajes</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          <span className="sm:inline">Exportar Datos</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className="rounded-md border pointer-events-auto"
            />
          </CardContent>
        </Card>

        {/* Monthly History Cards */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historial por Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando fichajes...</p>
                </div>
              ) : entriesByMonth.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay fichajes registrados</p>
                </div>
              ) : (
                entriesByMonth.map(([monthKey, entries]) => {
                  const [year, month] = monthKey.split('-');
                  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                  });
                  
                  return (
                    <Collapsible key={monthKey} defaultOpen={monthKey === entriesByMonth[0][0]}>
                      <Card className="border-2 hover:border-primary/50 transition-colors">
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                  <CardTitle className="text-lg capitalize text-primary">{monthName}</CardTitle>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {entries.length} fichaje{entries.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {entries.map((entry) => (
                                <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors gap-2">
                                  <div className="flex items-start sm:items-center gap-3 flex-1">
                                    <div className={`w-2 h-2 rounded-full mt-1 sm:mt-0 flex-shrink-0 ${
                                      entry.status === 'checked_out' ? 'bg-success' : 
                                      entry.status === 'checked_in' ? 'bg-primary' : 'bg-muted'
                                    }`}></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm">{formatDate(entry.date)}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {entry.check_in_time ? new Date(entry.check_in_time).toLocaleTimeString('es-ES') : '--'} → {entry.check_out_time ? new Date(entry.check_out_time).toLocaleTimeString('es-ES') : '--'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                                    <p className="font-semibold text-sm">
                                      {entry.total_hours ? formatDuration(String(entry.total_hours)) : '--'}
                                    </p>
                                    <Badge variant="outline" className="text-xs">
                                      {entry.status === 'checked_out' ? 'Completo' : 
                                       entry.status === 'checked_in' ? 'En curso' : 'Incompleto'}
                                    </Badge>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            toast({
                                              title: "Solicitud enviada",
                                              description: "El administrador revisará tu solicitud de cambio",
                                            });
                                          }}
                                        >
                                          <Flag className="mr-2 h-4 w-4" />
                                          Solicitar cambio
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}