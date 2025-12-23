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

// Detect if running on iOS
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Detect if running in standalone mode (installed PWA)
function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true;
}

// Google Sign In - uses redirect for iOS, popup for others
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
    
    // iOS Safari has issues with popups - use redirect directly
    if (isIOS()) {
      console.log('[Auth] iOS detected, using signInWithRedirect...');
      await signInWithRedirect(firebase.auth, provider);
      return null; // Result handled after redirect
    }
    
    // For other platforms, try popup
    try {
      console.log('[Auth] Trying signInWithPopup...');
      const result = await signInWithPopup(firebase.auth, provider);
      console.log('[Auth] Popup success:', result.user.email);
      return result.user;
    } catch (popupError: any) {
      console.log('[Auth] Popup failed:', popupError.code, popupError.message);
      
      // Fallback to redirect
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request') {
        console.log('[Auth] Falling back to signInWithRedirect...');
        await signInWithRedirect(firebase.auth, provider);
        return null;
      }
      throw popupError;
    }
  } catch (error) {
    console.error('[Auth] Google sign in error:', error);
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
  // Simple strategy: use the most recent data
  const localTime = new Date(localData.lastModified).getTime();
  const cloudTime = new Date(cloudData.lastModified).getTime();

  if (cloudTime > localTime) {
    console.log('Using cloud data (newer)');
    return cloudData;
  } else if (localTime > cloudTime) {
    console.log('Using local data (newer)');
    return localData;
  } else {
    // Same timestamp, merge by combining unique items
    console.log('Merging data (same timestamp)');
    return {
      version: Math.max(localData.version, cloudData.version),
      tasks: mergeArrays(localData.tasks, cloudData.tasks, 'id'),
      categories: mergeArrays(localData.categories, cloudData.categories, 'id'),
      habits: mergeArrays(localData.habits, cloudData.habits, 'id'),
      lastModified: new Date().toISOString(),
    };
  }
}

// Helper to merge arrays by unique key
function mergeArrays<T extends Record<string, any>>(arr1: T[], arr2: T[], key: keyof T): T[] {
  const map = new Map<any, T>();
  
  arr1.forEach(item => map.set(item[key], item));
  arr2.forEach(item => map.set(item[key], item));
  
  return Array.from(map.values());
}
