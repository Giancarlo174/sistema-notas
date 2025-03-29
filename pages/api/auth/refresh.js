import { createClient } from '@supabase/supabase-js';
import { serialize, parse } from 'cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parse(req.headers.cookie || '');
  const refreshToken = cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    // Crear cliente para operaciones de servidor
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Intercambiar refresh token por nuevos tokens
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) throw error;

    // Configurar nuevas cookies con los tokens actualizados
    res.setHeader('Set-Cookie', [
      serialize('access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 3600, // 1 hora
        path: '/',
      }),
      serialize('refresh_token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 días
        path: '/',
      }),
    ]);

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message: 'Sesión actualizada correctamente',
    });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}
