import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";

// Your custom production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjvwc8iC-eeEK2N1j6F2WdjMD1U1amflE",
  authDomain: "bachelorpointhostel-3b9bc.firebaseapp.com",
  databaseURL: "https://bachelorpointhostel-3b9bc-default-rtdb.firebaseio.com",
  projectId: "bachelorpointhostel-3b9bc",
  storageBucket: "bachelorpointhostel-3b9bc.firebasestorage.app",
  messagingSenderId: "551003853264",
  appId: "1:551003853264:web:f787f3195940a29f0269d5",
  measurementId: "G-SML4S4CKK1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore safely with fallback for sandboxed iframe environments where IndexedDB might be restricted
let dbInstance;
try {
  // Test if IndexedDB is available/accessible
  const isIndexedDBAccessible = typeof window !== "undefined" && "indexedDB" in window;
  if (isIndexedDBAccessible) {
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } else {
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
  }
} catch (error) {
  console.warn("Persistent local cache failed to initialize (likely due to iframe sandbox restrictions). Falling back to memory-only Firestore instance.", error);
  try {
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
  } catch (fallbackError) {
    // If initializeFirestore throws because it's already been called, get the existing instance
    dbInstance = getFirestore(app);
  }
}

export const db = dbInstance;
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
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
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
  
  const isPermissionError = errMsg.toLowerCase().includes("permission") || errMsg.toLowerCase().includes("insufficient");
  
  if (isPermissionError) {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("firestore-permission-error", { detail: errInfo });
      window.dispatchEvent(event);
    }
  } else {
    throw new Error(JSON.stringify(errInfo));
  }
}
