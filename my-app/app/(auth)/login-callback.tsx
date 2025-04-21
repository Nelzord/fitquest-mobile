import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';

export default function LoginCallback() {
  const router = useRouter();
  const { code } = useLocalSearchParams();

  useEffect(() => {
    console.log('Login callback received with code:', code);
    
    if (code) {
      console.log('Exchanging code for session...');
      supabase.auth.exchangeCodeForSession(String(code))
        .then(({ data, error }) => {
          if (error) {
            console.error('Error exchanging code for session:', error);
            router.replace('/(auth)/login');
          } else {
            console.log('Successfully exchanged code for session');
            // Close the browser window
            WebBrowser.dismissAuthSession();
            // Redirect to home page
            router.replace('/(tabs)');
          }
        });
    } else {
      console.log('No code present in callback');
      router.replace('/(auth)/login');
    }
  }, [code]);

  return null;
} 