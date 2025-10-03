import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LoginFormProps {
  // No props needed anymore as we use the auth hook directly
}

export function LoginForm({}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signIn(email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('Email not confirmed')) {
        setError("El email no ha sido confirmado. Contacta con el administrador.");
      } else if (err.message?.includes('Invalid login credentials')) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else {
        setError(err.message || "Error al iniciar sesión. Por favor, inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-[0_8px_40px_rgba(176,98,248,0.2)] border-primary/20 backdrop-blur-sm bg-white">
        <CardHeader className="space-y-6 text-center pb-8">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-3xl blur-2xl opacity-30 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-6 backdrop-blur-sm border border-primary/20">
                <img 
                  src="/logo-peli.png" 
                  alt="Logo Sistema Fichajes" 
                  className="h-28 w-28 object-contain drop-shadow-[0_0_15px_rgba(176,98,248,0.5)]"
                />
              </div>
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
              Bienvenido
            </CardTitle>
            <CardDescription className="text-base">
              Sistema de Fichajes de Empleados
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/20 backdrop-blur-sm">
            <h4 className="font-semibold text-sm mb-3 text-foreground flex items-center gap-2">
              <span className="text-primary">🔑</span> Credenciales de Prueba
            </h4>
            <div className="space-y-2 text-xs">
              <div className="bg-background/50 rounded-lg p-2 border border-primary/10">
                <p className="text-muted-foreground"><strong className="text-foreground">Admin:</strong> admin@empresa.com / admin123</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 border border-primary/10">
                <p className="text-muted-foreground"><strong className="text-foreground">Empleado:</strong> empleado@empresa.com / empleado123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}