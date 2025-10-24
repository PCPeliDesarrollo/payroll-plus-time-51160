import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanies } from "@/hooks/useCompanies";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function MigrateDataDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const { toast } = useToast();
  const { companies } = useCompanies();

  const handleMigrate = async () => {
    if (!companyId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selecciona una empresa',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-company-data', {
        body: { companyId },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error al migrar datos');
      }

      toast({
        title: '¡Migración completada!',
        description: `Se actualizaron ${data.totalUpdated} registros con la empresa seleccionada`,
      });

      setOpen(false);
      setCompanyId("");
      
      // Recargar la página para ver los cambios
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error migrating data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo migrar los datos',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50">
          <Database className="mr-2 h-4 w-4" />
          Recuperar Datos Antiguos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-500" />
            Recuperar Datos Antiguos
          </DialogTitle>
          <DialogDescription>
            Asigna una empresa a todos los registros antiguos (nóminas, vacaciones, etc.) que no tienen empresa asignada.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-sm text-orange-800">
            <strong>Importante:</strong> Esta acción asignará TODOS los datos antiguos sin empresa a la empresa que selecciones. 
            Asegúrate de elegir la empresa correcta.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="company">Selecciona la Empresa *</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Elige una empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.filter(c => c.is_active).map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Todos los registros antiguos se asociarán a esta empresa
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleMigrate} 
            disabled={loading || !companyId}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {loading ? 'Recuperando...' : 'Recuperar Datos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
