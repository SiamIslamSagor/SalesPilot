import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import apiService from "@/services/api";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  createdAt: string;
}

interface AuthContextType {
  user: AppUser | null;
  users: AppUser[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: Omit<AppUser, "id" | "createdAt">) => void;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  removeUser: (id: string) => void;
  isSuperAdmin: boolean;
  isPrivilegedUser: boolean;
}

const defaultUsers: AppUser[] = [
  {
    id: "u1",
    name: "Joni Admin",
    email: "joni@brandivaate.fi",
    role: "superadmin",
    createdAt: "2025-01-01",
  },
  {
    id: "u2",
    name: "Matti Virtanen",
    email: "matti@quotetool.fi",
    role: "admin",
    createdAt: "2025-06-15",
  },
  {
    id: "u3",
    name: "Liisa Järvinen",
    email: "liisa@quotetool.fi",
    role: "admin",
    createdAt: "2025-09-01",
  },
];

// Note: authentication is handled by the backend API

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem("qt_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    // Always ensure default users are present (handles stale localStorage)
    const stored = localStorage.getItem("qt_users");
    if (!stored) return defaultUsers;
    const parsed: AppUser[] = JSON.parse(stored);
    const merged = [...parsed];
    for (const du of defaultUsers) {
      if (!merged.find(u => u.email.toLowerCase() === du.email.toLowerCase())) {
        merged.push(du);
      }
    }
    return merged;
  });

  useEffect(() => {
    localStorage.setItem("qt_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (user) localStorage.setItem("qt_user", JSON.stringify(user));
    else localStorage.removeItem("qt_user");
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login({ email, password });

      if (
        typeof response === "object" &&
        response !== null &&
        "_id" in response &&
        "email" in response &&
        "role" in response
      ) {
        const data = response as {
          _id: string;
          name: string;
          email: string;
          role: "superadmin" | "admin";
        };

        const appUser: AppUser = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          createdAt: new Date().toISOString(),
        };

        setUser(appUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("qt_token");
  };

  const addUser = (data: Omit<AppUser, "id" | "createdAt">) => {
    const newUser: AppUser = {
      ...data,
      id: `u${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
    if (user?.id === id)
      setUser(prev => (prev ? { ...prev, ...updates } : prev));
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        addUser,
        updateUser,
        removeUser,
        isSuperAdmin: user?.role === "superadmin",
        isPrivilegedUser: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
