import { useState } from "react";
import { useVacations } from "@/hooks/useVacations";
import { useEmployees } from "@/hooks/useEmployees";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EmployeeVacationList } from "@/components/vacations/EmployeeVacationList";
import { EmployeeVacationDetail } from "@/components/vacations/EmployeeVacationDetail";
import { VacationPeriodsCard } from "@/components/vacations/VacationPeriodsCard";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminVacationsProps {
  onBack?: () => void;
}

// Get current period year
const getCurrentPeriodYear = (): number => {
  const now = new Date();
  return now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
};

export default function AdminVacations({ onBack }: AdminVacationsProps = {}) {
  const { vacationRequests, approveVacationRequest, rejectVacationRequest, loading } = useVacations();
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeBalance, setEmployeeBalance] = useState<any>(null);
  const [selectedPeriodYear, setSelectedPeriodYear] = useState<number>(getCurrentPeriodYear());

  const handleEmployeeClick = async (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    // Fetch balance for this employee
    try {
      const { data, error } = await supabase
        .from('vacation_balance')
        .select('*')
        .eq('user_id', employeeId)
        .maybeSingle();

      if (error) throw error;
      setEmployeeBalance(data);
    } catch (error) {
      console.error("Error fetching employee balance:", error);
      setEmployeeBalance(null);
    }
  };

  const handleBack = () => {
    setSelectedEmployeeId(null);
    setEmployeeBalance(null);
  };

  const handleApprove = async (id: string) => {
    try {
      await approveVacationRequest(id);
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud de vacaciones ha sido aprobada correctamente",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al aprobar la solicitud",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectVacationRequest(id);
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud de vacaciones ha sido rechazada",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al rechazar la solicitud",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vacation_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Solicitud eliminada",
        description: "La solicitud de vacaciones ha sido eliminada correctamente",
      });
      
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la solicitud",
      });
    }
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedEmployee = employees.find((emp) => emp.id === selectedEmployeeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  // Si hay un empleado seleccionado, mostrar su detalle
  if (selectedEmployeeId && selectedEmployee) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">
            Vacaciones de {selectedEmployee.full_name}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {selectedEmployee.department || "Sin departamento"}
          </p>
        </div>

        <EmployeeVacationDetail
          employee={selectedEmployee}
          vacationRequests={vacationRequests}
          vacationBalance={employeeBalance}
          onBack={handleBack}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {onBack && (
        <Button variant="outline" onClick={onBack} size="sm" className="w-full sm:w-auto">
          ← Volver al Dashboard
        </Button>
      )}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Gestión de Vacaciones</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Selecciona un empleado para ver y gestionar sus vacaciones
        </p>
      </div>

      {/* Vacation Periods Card */}
      <VacationPeriodsCard 
        selectedPeriodYear={selectedPeriodYear} 
        onPeriodChange={setSelectedPeriodYear} 
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar empleado..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <EmployeeVacationList
        employees={filteredEmployees}
        vacationRequests={vacationRequests}
        onEmployeeClick={handleEmployeeClick}
      />
    </div>
  );
}
