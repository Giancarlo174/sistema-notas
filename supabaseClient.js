import { createClient } from '@supabase/supabase-js';

// Solo usamos la anon key en el cliente, que tiene permisos limitados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Crear cliente sin persistencia en localStorage
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,  // No persista la sesión en localStorage
    autoRefreshToken: false,  // No almacene refresh tokens en cliente
    detectSessionInUrl: false  // No detectar sesiones en URL (evitar exposición)
  }
});

export default supabase;
