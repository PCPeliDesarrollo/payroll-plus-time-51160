import { useState, useEffect } from 'react';

type User = {
  id: string;
  email: string;
};

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  department?: string;
  employee_id?: string;
  hire_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Usuarios predefinidos para la versión offline
const DEMO_USERS = [
  {
    email: 'admin@empresa.com',
    password: 'admin123',
    profile: {
      id: '1',
      email: 'admin@empresa.com',
      full_name: 'Administrador Sistema',
      role: 'admin' as const,
      department: 'IT',
      employee_id: 'ADM001',
      hire_date: '2020-01-01',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },
  {
    email: 'empleado@empresa.com',
    password: 'empleado123',
    profile: {
      id: '2',
      email: 'empleado@empresa.com',
      full_name: 'Juan Pérez García',
      role: 'employee' as const,
      department: 'Ventas',
      employee_id: 'EMP001',
      hire_date: '2022-03-15',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
];

export function useAuthLocal() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedSession = localStorage.getItem('demo_session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        setUser(sessionData.user);
        setProfile(sessionData.profile);
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('demo_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
    
    if (!demoUser) {
      throw new Error('Credenciales incorrectas. Usa: admin@empresa.com/admin123 o empleado@empresa.com/empleado123');
    }

    const user = { id: demoUser.profile.id, email: demoUser.email };
    const profile = demoUser.profile;

    // Guardar sesión en localStorage
    localStorage.setItem('demo_session', JSON.stringify({ user, profile }));
    
    setUser(user);
    setProfile(profile);

    return { user, session: { user } };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    throw new Error('Registro no disponible en versión demo. Usa las credenciales de prueba.');
  };

  const signOut = async () => {
    localStorage.removeItem('demo_session');
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) throw new Error('No user logged in');
    
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    
    // Actualizar en localStorage
    const savedSession = localStorage.getItem('demo_session');
    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      sessionData.profile = updatedProfile;
      localStorage.setItem('demo_session', JSON.stringify(sessionData));
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}