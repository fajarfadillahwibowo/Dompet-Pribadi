export const ENVIRONMENT = {
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: Number(process.env.DB_PORT) || 3306,
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD ?? '',
  dbName: process.env.DB_NAME || 'fina_app',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  googleGenAIKey: process.env.GOOGLE_GEN_AI_API_KEY,
};

