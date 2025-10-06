import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  department: string | null;
}

interface VacationRequest {
  id: string;
  user_id: string;
  status: string;
  total_days: number;
}

interface EmployeeVacationListProps {
  employees: Employee[];
  vacationRequests: VacationRequest[];
  onEmployeeClick?: (employeeId: string) => void;
}

export function EmployeeVacationList({ 
  employees, 
  vacationRequests,
  onEmployeeClick 
}: EmployeeVacationListProps) {
  
  const getEmployeeVacations = (employeeId: string) => {
    return vacationRequests.filter(req => req.user_id === employeeId);
  };

  const getVacationIcon = (requests: VacationRequest[]) => {
    if (requests.length === 0) return null;
    
    const hasPending = requests.some(req => req.status === 'pending');
    const hasApproved = requests.some(req => req.status === 'approved');
    const hasRejected = requests.some(req => req.status === 'rejected');

    if (hasPending) {
      return <Clock className="h-5 w-5 text-accent" />;
    }
    if (hasApproved && !hasPending) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (hasRejected && !hasPending && !hasApproved) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
  };

  const getVacationBadges = (requests: VacationRequest[]) => {
    const pending = requests.filter(req => req.status === 'pending').length;
    const approved = requests.filter(req => req.status === 'approved').length;
    const rejected = requests.filter(req => req.status === 'rejected').length;

    return (
      <div className="flex gap-1 flex-wrap">
        {pending > 0 && (
          <Badge variant="secondary" className="text-xs bg-pending text-pending-foreground">
            {pending} pendiente{pending > 1 ? 's' : ''}
          </Badge>
        )}
        {approved > 0 && (
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {approved} aprobada{approved > 1 ? 's' : ''}
          </Badge>
        )}
        {rejected > 0 && (
          <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {rejected} rechazada{rejected > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Empleados ({employees.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {employees.map((employee) => {
            const employeeVacations = getEmployeeVacations(employee.id);
            const icon = getVacationIcon(employeeVacations);
            
            return (
              <div
                key={employee.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  employeeVacations.some(req => req.status === 'pending')
                    ? 'border-accent border-2 bg-accent/10 shadow-md'
                    : ''
                } ${onEmployeeClick ? 'cursor-pointer hover:bg-accent/20' : ''}`}
                onClick={() => onEmployeeClick?.(employee.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 relative">
                    {icon || <Users className="h-5 w-5 text-muted-foreground" />}
                    {employeeVacations.some(req => req.status === 'pending') && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      employeeVacations.some(req => req.status === 'pending')
                        ? 'text-accent font-bold'
                        : ''
                    }`}>
                      {employee.full_name}
                      {employeeVacations.some(req => req.status === 'pending') && ' 🔔'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {employee.department || 'Sin departamento'}
                    </p>
                  </div>
                </div>
                {employeeVacations.length > 0 && (
                  <div className="flex-shrink-0 ml-2">
                    {getVacationBadges(employeeVacations)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
