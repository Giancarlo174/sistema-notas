import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}
