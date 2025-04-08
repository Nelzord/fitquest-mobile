const localConfig = require('./app.config.local.js');

module.exports = ({ config }) => {
  // Use local configuration if available, otherwise use environment variables
  const supabaseUrl = localConfig?.extra?.supabaseUrl || process.env.SUPABASE_URL;
  const supabaseAnonKey = localConfig?.extra?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables or create app.config.local.js.'
    );
  }

  return {
    ...config,
    extra: {
      ...config.extra,
      supabaseUrl,
      supabaseAnonKey,
    },
  };
}; 