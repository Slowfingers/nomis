import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { signInWithGoogle, signOutUser, isFirebaseConfigured, subscribeToAuthState } from '../services/firebaseService';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  useFirebase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const useFirebase = isFirebaseConfigured();

  useEffect(() => {
    // For Firebase auth, use onAuthStateChanged as the primary auth tracker
    // This handles all auth methods: popup, redirect, and persisted sessions
    if (useFirebase) {
      console.log('[Auth] Setting up Firebase auth state listener');
      
      const unsubscribe = subscribeToAuthState((fbUser) => {
        console.log('[Auth] Auth state changed:', fbUser ? fbUser.email : 'null');
        
        if (fbUser) {
          const appUser: User = {
            id: fbUser.uid,
            name: fbUser.displayName || 'User',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || undefined
          };
          setUser(appUser);
          setFirebaseUser(fbUser);
          localStorage.setItem('nomis_user', JSON.stringify(appUser));
          console.log('[Auth] User authenticated:', appUser.email);
        } else {
          // Only clear if we were previously logged in
          setUser(null);
          setFirebaseUser(null);
          localStorage.removeItem('nomis_user');
          console.log('[Auth] User signed out');
        }
        setIsLoading(false);
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else {
      // Non-Firebase mode: check local storage
      const storedUser = localStorage.getItem('nomis_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user");
          localStorage.removeItem('nomis_user');
        }
      }
      setIsLoading(false);
    }
  }, [useFirebase]);

  const login = async () => {
    if (useFirebase) {
      // Use Firebase Authentication
      // For mobile: signInWithRedirect is used, returns null, onAuthStateChanged handles the rest
      // For desktop: signInWithPopup is used, onAuthStateChanged will fire automatically
      try {
        console.log('[Auth] Starting Google sign in...');
        await signInWithGoogle();
        // Don't set user here - onAuthStateChanged will handle it
      } catch (error) {
        console.error('Firebase login error:', error);
        throw error;
      }
    } else {
      // Fallback to demo mode
      console.warn('Firebase not configured. Using demo mode.');
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const demoUser: User = {
            id: 'demo-user-' + Date.now(),
            name: 'Demo User',
            email: 'demo@nomis.app',
            avatar: undefined
          };
          setUser(demoUser);
          localStorage.setItem('nomis_user', JSON.stringify(demoUser));
          resolve();
        }, 1000);
      });
    }
  };

  const logout = async () => {
    if (useFirebase) {
      try {
        await signOutUser();
        // onAuthStateChanged will handle clearing user state
      } catch (error) {
        console.error('Firebase logout error:', error);
        // Fallback: clear state manually if signOut fails
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem('nomis_user');
      }
    } else {
      // Non-Firebase mode: clear state manually
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('nomis_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, isLoading, useFirebase }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
