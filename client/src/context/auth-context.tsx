import React, { createContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (cpf: string, senha: string) => Promise<{ 
    success: boolean; 
    message?: string;
    isAdmin?: boolean;
    firstAccess?: boolean;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (cpf: string, senha: string) => {
    try {
      // Não use apiRequest aqui para poder tratar resposta 401 adequadamente
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, senha }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        return { 
          success: true,
          isAdmin: data.user.tipo === 'admin',
          firstAccess: data.user.primeiro_acesso
        };
      } else {
        console.error("Login failed:", data.message);
        return { 
          success: false, 
          message: data.message || 'Credenciais inválidas'
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        message: 'Erro ao tentar fazer login'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar sair. Tente novamente.",
      });
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
