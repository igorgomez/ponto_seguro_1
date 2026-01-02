import { Request, Response, NextFunction } from 'express';
import { verifyIdToken, getFirebaseAuth } from './firebaseAdmin';
import { storage } from './storage';

/**
 * Middleware para verificar Firebase ID token
 * Espera token em: Authorization: Bearer <idToken>
 * ou em cookie: __session
 */
export const firebaseAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let idToken = '';

    // Tenta obter token do header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      idToken = authHeader.slice(7); // Remove "Bearer "
    }

    // Fallback: tenta obter do cookie __session (Firebase padrão)
    if (!idToken && req.cookies?.__session) {
      idToken = req.cookies.__session;
    }

    if (!idToken) {
      return res.status(401).json({ message: 'Não autenticado. Token não fornecido.' });
    }

    // Verifica token com Firebase
    const decodedToken = await verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    // Procura usuário local por firebase_uid (será adicionado em migration)
    let user: any = (storage as any).getUserByFirebaseUid ? 
      await (storage as any).getUserByFirebaseUid(firebaseUid) : null;

    // Se não existe usuário local, cria um (apenas na primeira vez)
    if (!user) {
      try {
        const auth = getFirebaseAuth();
        const firebaseUser = await auth.getUser(firebaseUid);

        // Cria usuário local usando email do Firebase
        // Nota: CPF será preenchido após validação de primeira senha
        const newUser = await storage.createUser({
          nome: firebaseUser.displayName || 'Novo Usuário',
          cpf: `temp-${firebaseUid}`, // Temporário
          senha: '', // Não será usado com Firebase Auth
          tipo: 'empregado',
          email: firebaseUser.email || '',
          ativo: true,
          primeiro_acesso: true,
          // firebase_uid será adicionado quando a coluna existir
        });

        user = newUser;
      } catch (createError) {
        console.error('Erro ao criar usuário local na primeira autenticação:', createError);
        return res.status(500).json({
          message: 'Erro ao registrar usuário. Tente novamente.',
        });
      }
    }

    // Verifica se usuário está ativo
    if (!user.ativo) {
      return res.status(401).json({ message: 'Usuário inativo' });
    }

    // Armazena informações do usuário no request
    (req as any).user = user;
    (req as any).firebaseUid = firebaseUid;

    // Compatibilidade com código existente que usa session
    if (req.session) {
      (req.session as any).userId = user.id;
    }

    next();
  } catch (error) {
    console.error('Firebase auth middleware error:', error);

    // Diferencia entre token inválido e erro do servidor
    if ((error as any).code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token expirado. Faça login novamente.' });
    }

    if ((error as any).code?.startsWith('auth/')) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Middleware para verificar se usuário é admin
 * Deve ser usado APÓS firebaseAuthMiddleware
 */
export const firebaseAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    if (user.tipo !== 'admin') {
      return res.status(403).json({ message: 'Não autorizado. Requer privilégios de administrador.' });
    }

    next();
  } catch (error) {
    console.error('Firebase admin middleware error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Middleware para verificar se usuário é empregado
 * Deve ser usado APÓS firebaseAuthMiddleware
 */
export const firebaseEmployeeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    if (user.tipo !== 'empregado') {
      return res.status(403).json({ message: 'Não autorizado. Requer ser empregado.' });
    }

    next();
  } catch (error) {
    console.error('Firebase employee middleware error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export default {
  firebaseAuthMiddleware,
  firebaseAdminMiddleware,
  firebaseEmployeeMiddleware,
};
