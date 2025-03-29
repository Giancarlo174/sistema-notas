import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar que el usuario está autenticado usando cookies
  const cookies = parse(req.headers.cookie || '');
  const accessToken = cookies.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { action, payload } = req.body;
  
  try {
    // Usar el service key para tener acceso completo a la base de datos
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    let result;

    switch (action) {
      case 'getData':
        result = await adminSupabase.from(payload.table).select(payload.query);
        break;
      case 'insertData':
        result = await adminSupabase.from(payload.table).insert(payload.data);
        break;
      case 'updateData':
        result = await adminSupabase.from(payload.table)
          .update(payload.data)
          .match(payload.match);
        break;
      case 'deleteData':
        result = await adminSupabase.from(payload.table)
          .delete()
          .match(payload.match);
        break;
      case 'getProfile':
        // Ejemplo de operación específica para perfil
        result = await adminSupabase.from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        break;
      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
