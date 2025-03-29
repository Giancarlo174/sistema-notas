import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Configurar cookies httpOnly para almacenar tokens de forma segura
    const accessToken = data.session.access_token;
    const refreshToken = data.session.refresh_token;
    
    // Configurar cookie para access token (short-lived)
    res.setHeader('Set-Cookie', [
      serialize('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 3600, // 1 hora
        path: '/',
      }),
      serialize('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 días
        path: '/',
      }),
      // Cookie básica para state del cliente (no contiene tokens)
      serialize('auth_state', 'authenticated', {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      }),
    ]);

    // Solo devuelve información no sensible al cliente
    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message: 'Login exitoso',
    });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}
