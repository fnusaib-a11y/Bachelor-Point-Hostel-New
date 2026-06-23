import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Your custom production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCseb7XYsEnWQ1Pbv0SqqSeS8HoRgZxBvQ",
  authDomain: "deep-wares-464607-r1.firebaseapp.com",
  databaseURL: "https://deep-wares-464607-r1-default-rtdb.firebaseio.com",
  projectId: "deep-wares-464607-r1",
  storageBucket: "deep-wares-464607-r1.firebasestorage.app",
  messagingSenderId: "712102273506",
  appId: "1:712102273506:web:9a492a27af2bf26b7e19bb",
  measurementId: "G-KG7GWYZZ1N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling and IndexedDB persistent cache
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const auth = getAuth();

// Test connection with a slight delay to allow Firebase connection pooling to spin up
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or network status. Warning safely recorded.");
    }
  }
}
setTimeout(testConnection, 3000);

// Firestore error handling as mandated by the Firebase Integration Skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
