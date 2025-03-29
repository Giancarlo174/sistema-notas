import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import CustomHead from '../../components/CustomHead';
import Link from 'next/link';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ResetPassword() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState(null);
  const [tokenChecked, setTokenChecked] = useState(false);

  // Verificar si tenemos un hash en la URL (necesario para el restablecimiento)
  useEffect(() => {
    const checkTokenValidity = async () => {
      try {
        // No verificar manualmente el hash - dejar que Supabase lo maneje
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error verificando sesión:', error);
          setError('Hubo un problema verificando tu sesión. Por favor solicita un nuevo enlace.');
        } else if (!data.session) {
          console.warn('No se encontró sesión activa para restablecer contraseña');
          setError('Enlace de restablecimiento inválido o expirado. Por favor solicita un nuevo enlace.');
        } else {
          // Si hay una sesión, el enlace es válido
          console.log('Sesión válida encontrada, permitiendo restablecimiento');
          setError(null);
        }
      } catch (e) {
        console.error('Error inesperado:', e);
        setError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
      } finally {
        setTokenChecked(true);
      }
    };

    if (typeof window !== 'undefined') {
      checkTokenValidity();
    }
  }, [supabase.auth]);

  const validatePassword = () => {
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      setResetComplete(true);
      toast.success('Contraseña actualizada con éxito');
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      toast.error('Error al restablecer la contraseña: ' + error.message);
      
      if (error.message.includes('token') || error.message.includes('expired')) {
        setError('El enlace de restablecimiento es inválido o ha expirado. Por favor solicita un nuevo enlace.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función segura para volver al inicio
  const handleBackToLogin = () => {
    // Primero cerrar cualquier sesión existente para evitar entrar sin autenticación
    supabase.auth.signOut().then(() => {
      router.push('/');
    }).catch(err => {
      console.error('Error al cerrar sesión:', err);
      router.push('/');
    });
  };

  // Si todavía estamos verificando, mostrar carga
  if (!tokenChecked) {
    return (
      <>
        <CustomHead title="Verificando enlace - Sistema Académico" />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
            <FaLock className="mx-auto text-indigo-600 text-4xl mb-2" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Verificando enlace</h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomHead title="Restablecer contraseña - Sistema Académico" />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-center mb-6">
            <FaLock className="mx-auto text-indigo-600 text-4xl mb-2" />
            <h1 className="text-2xl font-bold text-gray-800">Restablecer contraseña</h1>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {resetComplete ? (
            <div className="text-center">
              <p className="mb-4 text-gray-600">
                Tu contraseña ha sido restablecida con éxito.
              </p>
              <button 
                onClick={handleBackToLogin}
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Ir al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={!!error && !error.includes('coinciden') && !error.includes('caracteres')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-700">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={!!error && !error.includes('coinciden') && !error.includes('caracteres')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || (!!error && !error.includes('coinciden') && !error.includes('caracteres'))}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={handleBackToLogin} 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
