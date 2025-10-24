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
import { SuperAdminPanel } from "./SuperAdminPanel";
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
      case "super-admin":
        return profile.role === "super_admin" ? <SuperAdminPanel onBack={() => setCurrentPage('dashboard')} /> : <Dashboard userRole={profile.role as "admin" | "employee"} onPageChange={setCurrentPage} />;
      case "dashboard":
        return <Dashboard userRole={profile.role as "admin" | "employee"} onPageChange={setCurrentPage} />;
      case "employees":
        return profile.role === "admin" || profile.role === "super_admin" ? <Employees onBack={() => setCurrentPage('dashboard')} /> : <Dashboard userRole={profile.role as "admin" | "employee"} onPageChange={setCurrentPage} />;
      case "attendance":
        return profile.role === "admin" ? <AdminAttendance onBack={() => setCurrentPage('dashboard')} /> : <MyAttendance />;
      case "payroll":
        return profile.role === "admin" ? <AdminPayroll onBack={() => setCurrentPage('dashboard')} /> : <MyPayroll />;
      case "vacations":
        return profile.role === "admin" ? <AdminVacations onBack={() => setCurrentPage('dashboard')} /> : <MyVacations />;
      case "schedule-changes":
        return profile.role === "admin" ? <AdminScheduleChanges onBack={() => setCurrentPage('dashboard')} /> : <Dashboard userRole={profile.role as "admin" | "employee"} onPageChange={setCurrentPage} />;
      case "settings":
        return profile.role === "admin" || profile.role === "super_admin" ? <AdminSettings /> : <MyProfile />;
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
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
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
        role: profile.role as "super_admin" | "admin" | "employee",
        companyName: (profile as any).companies?.name
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
