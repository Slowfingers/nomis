import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { signInWithGoogle, signOutUser, isFirebaseConfigured, subscribeToAuthState, handleRedirectResult } from '../services/firebaseService';
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
    let unsubscribe: (() => void) | null = null;
    
    const initializeAuth = async () => {
      if (useFirebase) {
        console.log('[Auth] Initializing Firebase auth...');
        
        // IMPORTANT: Check for redirect result first (for iOS redirect flow)
        // This must happen before onAuthStateChanged can return the user
        try {
          const redirectUser = await handleRedirectResult();
          if (redirectUser) {
            console.log('[Auth] Got user from redirect:', redirectUser.email);
            // User will be set by onAuthStateChanged, but we log it here
          }
        } catch (error) {
          console.error('[Auth] Redirect result check failed:', error);
        }
        
        // Set up auth state listener
        console.log('[Auth] Setting up auth state listener');
        unsubscribe = subscribeToAuthState((fbUser) => {
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
            setUser(null);
            setFirebaseUser(null);
            localStorage.removeItem('nomis_user');
            console.log('[Auth] No user / signed out');
          }
          setIsLoading(false);
        });
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
    };
    
    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
