import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function useSecureApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const callSecureApi = useCallback(async (action, payload) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/supabase-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
        credentials: 'include', // Importante para enviar cookies
      });
      
      // Si recibimos 401, la sesión ha expirado
      if (response.status === 401) {
        // Intentar refrescar el token
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (refreshResponse.ok) {
          // Reintentar la petición original
          const retryResponse = await fetch('/api/supabase-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload }),
            credentials: 'include',
          });
          
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            throw new Error(errorData.error || 'Error en la petición');
          }
          
          return await retryResponse.json();
        } else {
          // Si no se puede refrescar, redirigir a login
          router.push('/login');
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la petición');
      }
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { callSecureApi, loading, error };
}
