import { serialize } from 'cookie';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extraer el token de la cookie
  const accessToken = req.cookies.access_token;

  try {
    // Crear cliente Supabase con el token del usuario actual
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Invalidar sesión en el servidor
    if (accessToken) {
      await supabase.auth.admin.signOut(accessToken);
    }

    // Eliminar las cookies
    res.setHeader('Set-Cookie', [
      serialize('access_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: -1,
        path: '/',
      }),
      serialize('refresh_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: -1,
        path: '/',
      }),
      serialize('auth_state', '', {
        maxAge: -1,
        path: '/',
      }),
    ]);

    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
