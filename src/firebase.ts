import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let app;
let auth: any = null;
let db: any = null;

try {
  if (!firebaseConfig || !firebaseConfig.projectId || firebaseConfig.projectId === "TODO_PROJECT_ID") {
    throw new Error("Invalid Firebase configuration. Please check firebase-applet-config.json");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  
  // Validate Connection to Firestore
  const testConnection = async () => {
    try {
      if (db) {
        await getDocFromServer(doc(db, '_connection_test_', 'test'));
        console.log('Firestore connection test: Success');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Firestore connection test: Failed (offline)");
      }
    }
  };
  testConnection();
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  // Keep them as null so components can guard against them
}

export { auth, db };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
