import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function useAuth({ redirectTo = null, redirectIfFound = false } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUserLoggedIn() {
      try {
        // Verificar si la cookie de estado de autenticación existe
        const hasAuthCookie = document.cookie.includes('auth_state=authenticated');

        if (hasAuthCookie) {
          // Verificar la validez del token con el servidor
          const response = await fetch('/api/auth/validate', {
            method: 'GET',
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Si el token no es válido, intentar refrescarlo
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setUser(refreshData.user);
            } else {
              // Si no se puede refrescar, el usuario no está autenticado
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkUserLoggedIn();
  }, []);

  useEffect(() => {
    if (!redirectTo || loading) return;
    
    if (
      // Si redirectIfFound es verdadero, redirigir si el usuario está autenticado
      (redirectIfFound && user) ||
      // Si redirectIfFound es falso, redirigir si el usuario no está autenticado
      (!redirectIfFound && !user)
    ) {
      router.push(redirectTo);
    }
  }, [user, loading, redirectTo, redirectIfFound, router]);

  return { user, loading };
}
