import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  user: any;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Handle the redirect back to the app
    WebBrowser.maybeCompleteAuthSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.email);
        setUser(session.user);
        setIsAuthenticated(true);
        // Ensure we're on the main thread before navigation
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setIsAuthenticated(false);
        router.replace('/(auth)/login');
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Initial session found:', session.user.email);
        setUser(session.user);
        setIsAuthenticated(true);
        router.replace('/(tabs)');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: data.user.email ?? email,
            name: (data.user.email ?? email).split('@')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.user.id);

        if (updateError) throw updateError;

        const { error: statsError } = await supabase
          .from('user_stats')
          .insert({
            user_id: data.user.id,
            gold: 0,
            xp: 0,
            level: 1,
            chest_xp: 0,
            back_xp: 0,
            legs_xp: 0,
            shoulders_xp: 0,
            arms_xp: 0,
            core_xp: 0,
            cardio_xp: 0,
            last_updated: new Date().toISOString()
          });

        if (statsError) throw statsError;
      }

      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const redirectUrl = 'fitquest://login-callback';
      
      console.log('Starting Google Sign-In with redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true
        }
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Opening auth session with URL:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
          {
            showInRecents: true,
            preferEphemeralSession: false
          }
        );
        
        console.log('Auth session result:', result);
        
        if (result.type === 'success' && result.url) {
          // Extract the access token from the URL
          const accessToken = result.url.split('access_token=')[1]?.split('&')[0];
          if (accessToken) {
            console.log('Access token received, setting session...');
            // Set the session using the access token
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: result.url.split('refresh_token=')[1]?.split('&')[0] || '',
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              throw sessionError;
            }
            
            if (session) {
              console.log('Session set successfully, redirecting...');
              setUser(session.user);
              setIsAuthenticated(true);
              router.replace('/(tabs)');
            }
          }
        } else {
          console.log('Auth session failed or was cancelled');
        }
      } else {
        console.error('No auth URL returned from Supabase');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setIsAuthenticated(false);
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        signup,
        loginWithGoogle,
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