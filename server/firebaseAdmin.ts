import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

export { admin };

let firebaseApp: admin.app.App | undefined;

/**
 * Inicializa o Firebase Admin SDK com várias opções de configuração:
 * - SERVICE_ACCOUNT_KEY: JSON compact string (used first)
 * - SERVICE_ACCOUNT_PATH: path to service account JSON file
 * - GOOGLE_APPLICATION_CREDENTIALS: path to ADC JSON file (will fall back to ADC)
 * - If none provided, attempts Application Default Credentials (ADC)
 */
export const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    // 1) SERVICE_ACCOUNT_KEY (JSON string)
    const serviceAccountKey = process.env.SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('Firebase Admin SDK initialized using SERVICE_ACCOUNT_KEY');
      return firebaseApp;
    }

    // 2) SERVICE_ACCOUNT_PATH (file path to JSON)
    const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      const absPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.resolve(process.cwd(), serviceAccountPath);
      if (!fs.existsSync(absPath)) {
        throw new Error(`SERVICE_ACCOUNT_PATH file not found: ${absPath}`);
      }
      const serviceAccount = JSON.parse(fs.readFileSync(absPath, 'utf8'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('Firebase Admin SDK initialized using SERVICE_ACCOUNT_PATH');
      return firebaseApp;
    }

    // 3) GOOGLE_APPLICATION_CREDENTIALS or ADC
    const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (adcPath && fs.existsSync(adcPath)) {
      // Let ADC handle credentials, but initialize app
      firebaseApp = admin.initializeApp();
      console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS (ADC)');
      return firebaseApp;
    }

    // 4) Fallback to Application Default Credentials (environment provided by cloud)
    firebaseApp = admin.initializeApp();
    console.log('Firebase Admin SDK initialized using Application Default Credentials (ADC)');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    // Provide actionable error message for local dev
    if (!process.env.SERVICE_ACCOUNT_KEY && !process.env.SERVICE_ACCOUNT_PATH && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.error('No service account provided. For local development, set SERVICE_ACCOUNT_KEY or SERVICE_ACCOUNT_PATH, or set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file.');
    }
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
