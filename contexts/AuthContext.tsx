import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { signInWithGoogle, signOutUser, isFirebaseConfigured } from '../services/firebaseService';
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
    // Check local storage for existing session
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
  }, []);

  const login = async () => {
    if (useFirebase) {
      // Use Firebase Authentication
      try {
        const fbUser = await signInWithGoogle();
        if (fbUser) {
          console.log('Firebase user:', {
            displayName: fbUser.displayName,
            email: fbUser.email,
            photoURL: fbUser.photoURL
          });
          const appUser: User = {
            id: fbUser.uid,
            name: fbUser.displayName || 'User',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || undefined
          };
          console.log('App user:', appUser);
          setUser(appUser);
          setFirebaseUser(fbUser);
          localStorage.setItem('nomis_user', JSON.stringify(appUser));
        }
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
      } catch (error) {
        console.error('Firebase logout error:', error);
      }
    }
    
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('nomis_user');
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('access_token');
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
