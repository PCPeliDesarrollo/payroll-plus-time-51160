import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Download,
  Play,
  Square
} from "lucide-react";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useToast } from "@/hooks/use-toast";

export function MyAttendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const { timeEntries, currentEntry, loading, isCheckedIn, checkIn, checkOut } = useTimeEntries();
  const { toast } = useToast();

  // Update time every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Mis Fichajes</h2>
          <p className="text-muted-foreground">Registra tu entrada y salida, y consulta tu historial</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Datos
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check In/Out Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Fichar Entrada/Salida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-foreground">{currentTime}</div>
                <div className="text-muted-foreground">
                  {new Date().toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <Badge 
                    variant={isCheckedIn ? "default" : "outline"}
                    className={`px-4 py-2 text-sm ${
                      isCheckedIn 
                        ? "bg-success text-success-foreground" 
                        : "text-muted-foreground"
                    }`}
                  >
                    {isCheckedIn ? "Fichado - En el trabajo" : "No fichado"}
                  </Badge>
                </div>

                <Button
                  onClick={handleCheckInOut}
                  size="lg"
                  className={`h-16 px-8 text-lg font-semibold ${
                    isCheckedIn 
                      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                      : "bg-success hover:bg-success/90 text-success-foreground"
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

              {isCheckedIn && currentEntry?.check_in_time && (
                <div className="p-4 bg-success/10 rounded-lg">
                  <p className="text-sm text-success-foreground">
                    <strong>Entrada:</strong> {new Date(currentEntry.check_in_time).toLocaleTimeString('es-ES')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Fichajes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando fichajes...</p>
              </div>
            ) : timeEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay fichajes registrados</p>
              </div>
            ) : (
              timeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      entry.status === 'checked_out' ? 'bg-success' : 
                      entry.status === 'checked_in' ? 'bg-warning' : 'bg-muted'
                    }`}></div>
                    <div>
                      <p className="font-medium">{formatDate(entry.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        Entrada: {entry.check_in_time ? new Date(entry.check_in_time).toLocaleTimeString('es-ES') : '--'} • 
                        Salida: {entry.check_out_time ? new Date(entry.check_out_time).toLocaleTimeString('es-ES') : '--'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {entry.total_hours ? formatDuration(String(entry.total_hours)) : '--'}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {entry.status === 'checked_out' ? 'Completo' : 
                       entry.status === 'checked_in' ? 'En curso' : 'Incompleto'}
                    </Badge>
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