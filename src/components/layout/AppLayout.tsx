import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  user: {
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'employee';
    companyName?: string;
  };
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppLayout({ 
  user, 
  currentPage, 
  onPageChange, 
  onLogout, 
  children 
}: AppLayoutProps) {
  return (
    <div className="app-viewport flex bg-background overflow-hidden">
      <Sidebar
        userRole={user.role}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLogout={onLogout}
      />
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden w-full">
        <Header user={user} onLogout={onLogout} onPageChange={onPageChange} />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}