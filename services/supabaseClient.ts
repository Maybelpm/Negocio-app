
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Este código ya NO contiene tus claves.
// En su lugar, lee las "variables de entorno" que configurarás en Netlify.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si las variables no están definidas, lanza un error para evitar problemas.
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Anon Key is not defined in environment variables. Please set them in your deployment platform (e.g., Netlify, Vercel).");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
