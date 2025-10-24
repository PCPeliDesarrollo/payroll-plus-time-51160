import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Mail, Phone, MapPin, MoreHorizontal, Calendar, Shield } from "lucide-react";
import { CreateCompanyDialog } from "@/components/superadmin/CreateCompanyDialog";
import { CreateSuperAdminDialog } from "@/components/superadmin/CreateSuperAdminDialog";
import { CreateCompanyAdminDialog } from "@/components/superadmin/CreateCompanyAdminDialog";
import { CompanyEmployeesList } from "@/components/superadmin/CompanyEmployeesList";
import { useCompanies } from "@/hooks/useCompanies";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface SuperAdminPanelProps {
  onBack?: () => void;
}

export function SuperAdminPanel({ onBack }: SuperAdminPanelProps = {}) {
  const { companies, loading, deleteCompany, toggleCompanyStatus } = useCompanies();
  const { toast } = useToast();

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      await toggleCompanyStatus(companyId, !currentStatus);
    } catch (error) {
      console.error('Error toggling company status:', error);
    }
  };

  const handleDelete = async (companyId: string, companyName: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la empresa "${companyName}"? Esta acción eliminará todos los datos asociados.`)) {
      try {
        await deleteCompany(companyId);
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="outline" onClick={onBack} size="sm">
          ← Volver al Dashboard
        </Button>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Panel Super Administrador
          </h2>
          <p className="text-muted-foreground">Gestiona todas las empresas y super administradores del sistema</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CreateSuperAdminDialog />
          <CreateCompanyAdminDialog />
          <CreateCompanyDialog />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              {companies.filter(c => c.is_active).length} activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
            <Building2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {companies.filter(c => c.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((companies.filter(c => c.is_active).length / companies.length) * 100).toFixed(0)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Inactivas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {companies.filter(c => !c.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Suspendidas temporalmente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empleados por Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Empleados por Empresa
          </CardTitle>
          <CardDescription>
            Vista de todos los empleados organizados por empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando empresas...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay empresas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.filter(c => c.is_active).map((company) => (
                <CompanyEmployeesList 
                  key={company.id}
                  companyId={company.id}
                  companyName={company.name}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Empresas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Empresas Registradas
          </CardTitle>
          <CardDescription>
            Gestiona todas las empresas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando empresas...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay empresas registradas</p>
              <p className="text-sm text-muted-foreground mt-2">Crea una nueva empresa para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {companies.map((company) => (
                <Card key={company.id} className="transition-all duration-200 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-card-foreground truncate">
                            {company.name}
                          </h3>
                          <Badge 
                            variant={company.is_active ? 'default' : 'secondary'}
                            className={company.is_active ? 'bg-success text-success-foreground mt-1' : 'mt-1'}
                          >
                            {company.is_active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Empleados</DropdownMenuItem>
                          <DropdownMenuItem>Editar Información</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(company.id, company.is_active)}
                          >
                            {company.is_active ? 'Desactivar' : 'Activar'} Empresa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(company.id, company.name)}
                          >
                            Eliminar Empresa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      {company.contact_email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{company.contact_email}</span>
                        </div>
                      )}
                      {company.contact_phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{company.contact_phone}</span>
                        </div>
                      )}
                      {company.address && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{company.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>
                          Creada el {format(new Date(company.created_at), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}