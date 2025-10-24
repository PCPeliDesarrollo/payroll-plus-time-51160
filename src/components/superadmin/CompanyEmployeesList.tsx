import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ChevronDown, ChevronUp, Mail, Phone, Calendar, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  department: string | null;
  employee_id: string | null;
  hire_date: string | null;
  is_active: boolean;
}

interface CompanyEmployeesListProps {
  companyId: string;
  companyName: string;
}

export function CompanyEmployeesList({ companyId, companyName }: CompanyEmployeesListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [companyId, isOpen]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', className: 'bg-primary' },
      employee: { label: 'Empleado', className: 'bg-secondary' },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, className: 'bg-muted' };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const activeEmployees = employees.filter(e => e.is_active);
  const inactiveEmployees = employees.filter(e => !e.is_active);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {companyName}
              </CardTitle>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {employees.length} empleados
                </Badge>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando empleados...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay empleados registrados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Empleados Activos */}
                {activeEmployees.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                      Activos ({activeEmployees.length})
                    </h4>
                    <div className="grid gap-3">
                      {activeEmployees.map((employee) => (
                        <Card key={employee.id} className="bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="font-semibold">{employee.full_name}</h5>
                                {employee.employee_id && (
                                  <p className="text-sm text-muted-foreground">
                                    ID: {employee.employee_id}
                                  </p>
                                )}
                              </div>
                              {getRoleBadge(employee.role)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{employee.email}</span>
                              </div>
                              
                              {employee.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4 flex-shrink-0" />
                                  <span>{employee.phone}</span>
                                </div>
                              )}
                              
                              {employee.department && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Briefcase className="h-4 w-4 flex-shrink-0" />
                                  <span>{employee.department}</span>
                                </div>
                              )}
                              
                              {employee.hire_date && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4 flex-shrink-0" />
                                  <span>
                                    Desde {format(new Date(employee.hire_date), 'dd/MM/yyyy', { locale: es })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empleados Inactivos */}
                {inactiveEmployees.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
                      Inactivos ({inactiveEmployees.length})
                    </h4>
                    <div className="grid gap-3">
                      {inactiveEmployees.map((employee) => (
                        <Card key={employee.id} className="bg-muted/10 opacity-60">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="font-semibold">{employee.full_name}</h5>
                                {employee.employee_id && (
                                  <p className="text-sm text-muted-foreground">
                                    ID: {employee.employee_id}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {getRoleBadge(employee.role)}
                                <Badge variant="secondary">Inactivo</Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{employee.email}</span>
                              </div>
                              
                              {employee.department && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Briefcase className="h-4 w-4 flex-shrink-0" />
                                  <span>{employee.department}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
