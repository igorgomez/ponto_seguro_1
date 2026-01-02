import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

export { admin };
export const Timestamp = admin.firestore.Timestamp;

/**
 * Inicializa o Firebase Admin SDK
 * Requer SERVICE_ACCOUNT_KEY como JSON string em variável de ambiente
 */

let firebaseApp: admin.app.App;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccountKey = process.env.SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error(
        'SERVICE_ACCOUNT_KEY not found in environment variables. ' +
        'Set it with your Firebase service account JSON content.'
      );
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
};

/**
 * Obtém instância do Firebase Admin Auth
 */
export const getFirebaseAuth = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
};

/**
 * Obtém instância do Firestore
 */
export const getFirestore = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
};

/**
 * Verifica um ID token do Firebase
 */
export const verifyIdToken = async (idToken: string) => {
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
};

/**
 * Obtém um usuário do Firebase Auth por UID
 */
export const getFirebaseUser = async (uid: string) => {
  try {
    const auth = getFirebaseAuth();
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    throw error;
  }
};

/**
 * Cria um usuário no Firebase Auth
 */
export const createFirebaseUser = async (email: string, password: string) => {
  try {
    const auth = getFirebaseAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });
    return userRecord;
  } catch (error) {
    console.error('Error creating Firebase user:', error);
    throw error;
  }
};

/**
 * Define custom claims (ex: role de usuário) no Firebase
 */
export const setCustomClaims = async (uid: string, claims: Record<string, any>) => {
  try {
    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw error;
  }
};

export default {
  initializeFirebase,
  getFirebaseAuth,
  getFirestore,
  verifyIdToken,
  getFirebaseUser,
  createFirebaseUser,
  setCustomClaims,
};
