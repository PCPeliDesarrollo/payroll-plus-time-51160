import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "./Dashboard";
import { Employees } from "./Employees";
import { MyAttendance } from "./MyAttendance";
import { MyPayroll } from "./MyPayroll";
import { MyVacations } from "./MyVacations";
import { MyScheduleChanges } from "./MyScheduleChanges";
import { AdminAttendance } from "./AdminAttendance";
import { AdminPayroll } from "./AdminPayroll";
import AdminVacations from "./AdminVacations";
import AdminScheduleChanges from "./AdminScheduleChanges";
import { AdminSettings } from "./AdminSettings";
import { AdminRegularization } from "./AdminRegularization";
import { MyProfile } from "./MyProfile";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const { user, profile, loading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setCurrentPage("dashboard");
  };

  const renderCurrentPage = () => {
    if (!user || !profile) return null;

    switch (currentPage) {
      case "dashboard":
        return <Dashboard userRole={profile.role as "admin" | "employee"} onPageChange={setCurrentPage} />;
      case "employees":
        return profile.role === "admin" ? <Employees onBack={() => setCurrentPage('dashboard')} /> : <Dashboard userRole={profile.role as "admin" | "employee"} onPageChange={setCurrentPage} />;
      case "attendance":
        return profile.role === "admin" ? <AdminAttendance onBack={() => setCurrentPage('dashboard')} /> : <MyAttendance />;
      case "payroll":
        return profile.role === "admin" ? <AdminPayroll onBack={() => setCurrentPage('dashboard')} /> : <MyPayroll />;
      case "vacations":
        return profile.role === "admin" ? <AdminVacations onBack={() => setCurrentPage('dashboard')} /> : <MyVacations />;
      case "schedule-changes":
        return profile.role === "admin" ? <AdminScheduleChanges onBack={() => setCurrentPage('dashboard')} /> : <Dashboard userRole={profile.role as "admin" | "employee"} onPageChange={setCurrentPage} />;
      case "settings":
        return profile.role === "admin" ? <AdminSettings /> : <MyProfile />;
      case "regularization":
        return profile.role === "admin" ? <AdminRegularization /> : <Dashboard userRole={profile.role as "admin" | "employee"} onPageChange={setCurrentPage} />;
      case "my-attendance":
        return <MyAttendance />;
      case "my-payroll":
        return <MyPayroll />;
      case "my-vacations":
        return <MyVacations />;
      case "my-schedule-changes":
        return <MyScheduleChanges />;
      case "my-profile":
        return <MyProfile />;
      default:
        return <Dashboard userRole={profile.role as "admin" | "employee"} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-8 animate-fade-in">
          {/* Pensando animation */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-primary/30 animate-pulse" />
            
            {/* Inner thinking dots */}
            <div className="relative flex gap-3 z-10">
              <div className="h-4 w-4 rounded-full bg-primary animate-bounce [animation-delay:-0.3s] shadow-lg shadow-primary/50" />
              <div className="h-4 w-4 rounded-full bg-primary animate-bounce [animation-delay:-0.15s] shadow-lg shadow-primary/50" />
              <div className="h-4 w-4 rounded-full bg-primary animate-bounce shadow-lg shadow-primary/50" />
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              RRHH PcPeli
            </h1>
            <p className="text-muted-foreground text-sm animate-pulse">
              Cargando...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginForm />;
  }

  return (
    <AppLayout
      user={{
        name: profile.full_name,
        email: profile.email,
        role: profile.role as "admin" | "employee"
      }}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderCurrentPage()}
    </AppLayout>
  );
};

export default Index;
