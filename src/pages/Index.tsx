import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "./Dashboard";
import { Employees } from "./Employees";
import { MyAttendance } from "./MyAttendance";
import { MyPayroll } from "./MyPayroll";
import { MyVacations } from "./MyVacations";
import { AdminAttendance } from "./AdminAttendance";
import { AdminPayroll } from "./AdminPayroll";
import AdminVacations from "./AdminVacations";
import { AdminSettings } from "./AdminSettings";
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
        return <Dashboard userRole={profile.role as "admin" | "employee"} />;
      case "employees":
        return profile.role === "admin" ? <Employees /> : <Dashboard userRole={profile.role as "admin" | "employee"} />;
      case "attendance":
        return profile.role === "admin" ? <AdminAttendance /> : <MyAttendance />;
      case "payroll":
        return profile.role === "admin" ? <AdminPayroll /> : <MyPayroll />;
      case "vacations":
        return profile.role === "admin" ? <AdminVacations /> : <MyVacations />;
      case "settings":
        return profile.role === "admin" ? <AdminSettings /> : <MyProfile />;
      case "my-attendance":
        return <MyAttendance />;
      case "my-payroll":
        return <MyPayroll />;
      case "my-vacations":
        return <MyVacations />;
      case "my-profile":
        return <MyProfile />;
      default:
        return <Dashboard userRole={profile.role as "admin" | "employee"} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
