import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  user: any;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Starting auth status check...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        throw error;
      }
      
      if (session) {
        console.log('✅ Session found:', {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: session.expires_at
        });
        setUser(session.user);
        setIsAuthenticated(true);
        setIsGuest(false);
      } else {
        console.log('⚠️ No active session found');
        const guestStatus = await AsyncStorage.getItem('is_guest');
        console.log('Guest status:', guestStatus);
        setIsGuest(guestStatus === 'true');
      }
    } catch (error) {
      console.error('❌ Error in checkAuthStatus:', error);
    } finally {
      console.log('🏁 Auth check completed');
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      setIsAuthenticated(true);
      setIsGuest(false);
      await AsyncStorage.setItem('is_guest', 'false');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      // First, sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // The trigger will automatically create the user record in the users table
      // We can update the user record with additional information if needed
      if (data.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: data.user.email ?? email, // Use provided email if user.email is undefined
            name: (data.user.email ?? email).split('@')[0], // Set a default name from email
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.user.id);

        if (updateError) throw updateError;
      }

      setUser(data.user);
      setIsAuthenticated(true);
      setIsGuest(false);
      await AsyncStorage.setItem('is_guest', 'false');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const loginAsGuest = async () => {
    try {
      await AsyncStorage.setItem('is_guest', 'true');
      setIsGuest(true);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Guest login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await AsyncStorage.removeItem('is_guest');
      setIsAuthenticated(false);
      setIsGuest(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isGuest,
        login,
        signup,
        loginAsGuest,
        logout,
        loading,
        user,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 