import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCompanies } from "@/hooks/useCompanies";

export function CreateCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createCompany } = useCompanies();

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    logo_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      await createCompany(formData);
      setFormData({
        name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        logo_url: '',
      });
      setOpen(false);
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Empresa</DialogTitle>
          <DialogDescription>
            Completa la información de la empresa que deseas agregar al sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Empresa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Ej: Empresa XYZ S.L."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Email de Contacto</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              placeholder="contacto@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
              placeholder="+34 XXX XX XX XX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Dirección completa de la empresa"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">URL del Logo (opcional)</Label>
            <Input
              id="logo_url"
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? 'Creando...' : 'Crear Empresa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}