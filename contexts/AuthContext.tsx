import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    // Check if Google Client ID is configured
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here.apps.googleusercontent.com') {
      // Fallback to demo mode if OAuth is not configured
      console.warn('Google OAuth not configured. Using demo mode.');
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

    // Real Google OAuth flow
    try {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', 'openid profile email');
      authUrl.searchParams.set('state', generateRandomState());

      // Store the state for verification
      const state = authUrl.searchParams.get('state');
      if (state) {
        sessionStorage.setItem('oauth_state', state);
      }

      // Redirect to Google OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('OAuth error:', error);
      throw new Error('Failed to initiate Google login');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nomis_user');
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('access_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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

// Helper function to generate random state for OAuth security
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
