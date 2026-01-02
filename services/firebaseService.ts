import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, browserLocalPersistence, setPersistence, User as FirebaseUser } from 'firebase/auth';
import { Task, Category, Habit } from '../types';
import { AppData } from '../utils/dataManager';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'your_firebase_api_key_here'
  );
}

// Initialize Firebase
export function initializeFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } | null {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase not configured. Cloud sync disabled.');
    return null;
  }

  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
    }
    return { app, db, auth };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
}

// Detect if running in standalone mode (installed PWA)
function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true;
}

// Google Sign In - use redirect for PWA standalone, popup for browser
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  const firebase = initializeFirebase();
  if (!firebase) return null;

  try {
    // Set persistence to local for reliable session storage
    await setPersistence(firebase.auth, browserLocalPersistence);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // PWA standalone mode doesn't support popup - use redirect
    if (isStandalone()) {
      console.log('[Auth] PWA standalone detected, using signInWithRedirect...');
      await signInWithRedirect(firebase.auth, provider);
      return null; // Result handled after redirect via getRedirectResult
    }
    
    // Regular browser - use popup
    console.log('[Auth] Using signInWithPopup...');
    const result = await signInWithPopup(firebase.auth, provider);
    console.log('[Auth] Popup success:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('[Auth] Google sign in error:', error.code, error.message);
    throw error;
  }
}

// Handle redirect result after OAuth redirect - MUST be called on app init
export async function handleRedirectResult(): Promise<FirebaseUser | null> {
  const firebase = initializeFirebase();
  if (!firebase) return null;

  try {
    console.log('[Auth] Checking for redirect result...');
    const result = await getRedirectResult(firebase.auth);
    if (result) {
      console.log('[Auth] Redirect result found:', result.user.email);
      return result.user;
    }
    console.log('[Auth] No redirect result');
    return null;
  } catch (error: any) {
    console.error('[Auth] Redirect result error:', error.code, error.message);
    // Don't throw - just return null and let onAuthStateChanged handle it
    return null;
  }
}

// Subscribe to auth state changes - this is the reliable way to track auth
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): (() => void) | null {
  const firebase = initializeFirebase();
  if (!firebase) return null;

  return onAuthStateChanged(firebase.auth, callback);
}

// Get current auth user
export function getCurrentUser(): FirebaseUser | null {
  const firebase = initializeFirebase();
  if (!firebase) return null;
  return firebase.auth.currentUser;
}

// Sign Out
export async function signOutUser(): Promise<void> {
  const firebase = initializeFirebase();
  if (!firebase) return;

  try {
    await signOut(firebase.auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// Save user data to Firestore
export async function saveUserData(
  userId: string,
  tasks: Task[],
  categories: Category[],
  habits: Habit[]
): Promise<string> {
  const firebase = initializeFirebase();
  if (!firebase) {
    throw new Error('Firebase not initialized');
  }

  try {
    const userDocRef = doc(firebase.db, 'users', userId);
    const timestamp = new Date().toISOString();
    const data: AppData = {
      version: 1,
      tasks,
      categories,
      habits,
      lastModified: timestamp,
    };

    await setDoc(userDocRef, data, { merge: true });
    console.log('Data synced to cloud');
    return timestamp;
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Load user data from Firestore
export async function loadUserData(userId: string): Promise<AppData | null> {
  const firebase = initializeFirebase();
  if (!firebase) {
    return null;
  }

  try {
    const userDocRef = doc(firebase.db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as AppData;
    }
    return null;
  } catch (error) {
    console.error('Error loading from Firestore:', error);
    return null;
  }
}

// Subscribe to real-time updates
export function subscribeToUserData(
  userId: string,
  callback: (data: AppData | null) => void
): Unsubscribe | null {
  const firebase = initializeFirebase();
  if (!firebase) {
    return null;
  }

  try {
    const userDocRef = doc(firebase.db, 'users', userId);
    return onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as AppData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in real-time listener:', error);
      }
    );
  } catch (error) {
    console.error('Error setting up listener:', error);
    return null;
  }
}

// Merge local and cloud data (conflict resolution)
export function mergeData(localData: AppData, cloudData: AppData): AppData {
  // Smart merge strategy: combine all unique items from both sources
  // For conflicts (same ID), use the item with the most recent modification
  console.log('Smart merging local and cloud data');
  
  return {
    version: Math.max(localData.version, cloudData.version),
    tasks: mergeArraysWithTimestamp(localData.tasks, cloudData.tasks, 'id'),
    categories: mergeArraysWithTimestamp(localData.categories, cloudData.categories, 'id'),
    habits: mergeArraysWithTimestamp(localData.habits, cloudData.habits, 'id'),
    lastModified: new Date().toISOString(),
  };
}

// Helper to merge arrays by unique key with timestamp comparison
function mergeArraysWithTimestamp<T extends Record<string, any>>(arr1: T[], arr2: T[], key: keyof T): T[] {
  const map = new Map<any, T>();
  
  // Add all items from arr1
  arr1.forEach(item => map.set(item[key], item));
  
  // Add items from arr2, but only if they're newer or don't exist yet
  arr2.forEach(item => {
    const existing = map.get(item[key]);
    if (!existing) {
      // New item, add it
      map.set(item[key], item);
    } else {
      // Item exists, compare timestamps if available
      const existingTime = existing.createdAt || existing.lastModified || 0;
      const newTime = item.createdAt || item.lastModified || 0;
      
      if (newTime > existingTime) {
        // Cloud version is newer, use it
        map.set(item[key], item);
      }
      // Otherwise keep the existing (local) version
    }
  });
  
  return Array.from(map.values());
}

// Helper to merge arrays by unique key (simple version, kept for compatibility)
function mergeArrays<T extends Record<string, any>>(arr1: T[], arr2: T[], key: keyof T): T[] {
  const map = new Map<any, T>();
  
  arr1.forEach(item => map.set(item[key], item));
  arr2.forEach(item => map.set(item[key], item));
  
  return Array.from(map.values());
}
