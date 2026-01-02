import React, { createContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import {
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChange,
  getIdToken,
} from "@/lib/firebase";
import { FirebaseError } from "firebase/app";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firebaseUser: any; // Firebase User object
  login: (email: string, password: string) => Promise<{ 
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
  firebaseUser: null,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Observer de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          
          // Obtém ID token e faz refresh de dados do usuário local
          const idToken = await getIdToken(fbUser);
          
          // Busca dados do usuário local
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token é válido mas usuário não existe no servidor
            setUser(null);
          }
        } else {
          // Usuário fez logout
          setFirebaseUser(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Error setting up auth state:", error);
        setFirebaseUser(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Login function com Firebase
  const login = async (email: string, password: string) => {
    try {
      // Faz login no Firebase
      const fbUser = await firebaseSignIn(email, password);
      const idToken = await getIdToken(fbUser);

      // Envia requisição ao servidor para sincronizar usuário local
      const response = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: fbUser.email,
          uid: fbUser.uid,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setFirebaseUser(fbUser);
        return { 
          success: true,
          isAdmin: data.user.tipo === 'admin',
          firstAccess: data.user.primeiro_acesso
        };
      } else {
        return { 
          success: false, 
          message: data.message || 'Erro ao fazer login'
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      
      if (error instanceof FirebaseError) {
        let message = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') {
          message = 'E-mail não encontrado';
        } else if (error.code === 'auth/wrong-password') {
          message = 'Senha incorreta';
        } else if (error.code === 'auth/invalid-email') {
          message = 'E-mail inválido';
        }
        return { success: false, message };
      }
      
      return { 
        success: false, 
        message: 'Erro ao tentar fazer login'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setFirebaseUser(null);
      
      // Optionally notify server
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
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
      if (!firebaseUser) return;

      const idToken = await getIdToken(firebaseUser);
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
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
        firebaseUser,
        login, 
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
