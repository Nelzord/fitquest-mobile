import Constants from 'expo-constants';

// Get the Supabase URL and Anon Key from app.config.js
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Validate that required environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables. Please check your app.config.js file.'
  );
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
}; 