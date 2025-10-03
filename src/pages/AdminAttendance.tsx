import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimeEntry {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: any;
  status: string;
  profiles: {
    full_name: string;
    department: string | null;
  };
}

export function AdminAttendance() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimeEntries();
  }, [selectedDate]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          profiles!inner(full_name, department)
        `)
        .eq('date', selectedDate)
        .order('check_in_time', { ascending: false });

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

  const filteredEntries = timeEntries.filter(entry =>
    entry.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.profiles?.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const csvContent = [
      ['Empleado', 'Departamento', 'Entrada', 'Salida', 'Total Horas', 'Estado'].join(','),
      ...filteredEntries.map(entry => [
        entry.profiles?.full_name || '',
        entry.profiles?.department || '',
        formatTime(entry.check_in_time),
        formatTime(entry.check_out_time),
        formatDuration(entry.total_hours),
        entry.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fichajes_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Gestión de Fichajes</h2>
          <p className="text-sm md:text-base text-muted-foreground">Controla la asistencia de todos los empleados</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="w-full md:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Fichajes del {new Date(selectedDate).toLocaleDateString('es-ES')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por empleado o departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full md:w-40"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando fichajes...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron fichajes para esta fecha</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/50 rounded-lg border gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <p className="font-medium text-sm md:text-base">{entry.profiles?.full_name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {entry.profiles?.department || 'Sin departamento'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 md:gap-6">
                    <div className="text-center">
                      <p className="text-xs md:text-sm text-muted-foreground">Entrada</p>
                      <p className="font-medium text-sm md:text-base">{formatTime(entry.check_in_time)}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs md:text-sm text-muted-foreground">Salida</p>
                      <p className="font-medium text-sm md:text-base">{formatTime(entry.check_out_time)}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                      <p className="font-medium text-sm md:text-base">{formatDuration(entry.total_hours)}</p>
                    </div>
                    
                    <div className="text-center">
                      {getStatusBadge(entry.status)}
                    </div>
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