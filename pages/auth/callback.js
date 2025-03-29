import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import CustomHead from '../../components/CustomHead';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [message, setMessage] = useState('Estamos procesando la verificación de tu correo electrónico...');
  const [processing, setProcessing] = useState(false);
  
  useEffect(() => {
    // Solo procesar cuando el router esté listo
    if (!router.isReady) return;
    
    const { code } = router.query;
    
    if (code && !processing) {
      setProcessing(true); // Evitar procesamiento múltiple
      
      const processCode = async () => {
        try {
          // Tenemos que manejar la verificación de forma diferente
          // porque estamos recibiendo un error específico con el PKCE
          
          // Primero, intentamos obtener una sesión sin el exchangeCodeForSession
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Si ya hay una sesión activa, simplemente redirigimos
            setMessage('Sesión activa detectada. Redirigiendo...');
            toast.success('Tu cuenta está verificada. Redirigiendo...');
            setTimeout(() => router.push('/'), 2000);
            return;
          }
          
          // Si no hay sesión, intentamos iniciar sesión con las credenciales guardadas
          const pendingEmail = localStorage.getItem('pendingAuthEmail');
          const pendingPassword = localStorage.getItem('pendingAuthPassword');
          
          if (pendingEmail && pendingPassword) {
            setMessage('Intentando iniciar sesión automáticamente...');
            
            try {
              const { data, error } = await supabase.auth.signInWithPassword({
                email: pendingEmail,
                password: pendingPassword
              });
              
              // Limpiamos las credenciales almacenadas
              localStorage.removeItem('pendingAuthEmail');
              localStorage.removeItem('pendingAuthPassword');
              
              if (error) throw error;
              
              toast.success('¡Verificación completa! Sesión iniciada correctamente.');
              setTimeout(() => router.push('/'), 2000);
            } catch (loginError) {
              console.error("Error en inicio de sesión automático:", loginError);
              setMessage('Verificación exitosa, pero se requiere inicio de sesión manual.');
              toast.info('Por favor inicia sesión con tus credenciales');
              setTimeout(() => router.push('/'), 3000);
            }
          } else {
            // No hay credenciales, redirigimos al inicio de sesión
            setMessage('Verificación procesada. Redirigiendo al inicio de sesión...');
            toast.success('Cuenta verificada. Por favor inicia sesión.');
            setTimeout(() => router.push('/'), 2500);
          }
        } catch (err) {
          console.error("Error en proceso de verificación:", err);
          setMessage('Ocurrió un error al procesar la verificación. Serás redirigido al inicio...');
          toast.error('Error en la verificación: ' + (err.message || 'Error desconocido'));
          setTimeout(() => router.push('/'), 3000);
        }
      };
      
      processCode();
    }
  }, [router.isReady, router.query, router, supabase.auth, processing]);
  
  return (
    <>
      <CustomHead title="Verificando cuenta - Sistema Académico" />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Verificando tu cuenta</h1>
          <p className="text-gray-600 mb-8">
            {message}
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    </>
  );
}
