import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebase";

// Provedor de autenticação do Google
const googleProvider = new GoogleAuthProvider();

// Função para login com Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // O token de acesso do Google pode ser usado para acessar a API do Google
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    // Informações do usuário logado
    const user = result.user;
    
    return {
      success: true,
      user,
      token
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Função para logout
export const logoutFirebase = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Retorna o usuário atual do Firebase
export const getCurrentUser = () => {
  return auth.currentUser;
};