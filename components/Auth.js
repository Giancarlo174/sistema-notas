import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// Función para traducir mensajes de error de Supabase
const translateAuthError = (errorMessage) => {
  const errorTranslations = {
    'Invalid login credentials': 'Credenciales de inicio de sesión inválidas',
    'Email not confirmed': 'Correo electrónico no confirmado',
    'User already registered': 'El correo ya está registrado en el sistema',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Email format is invalid': 'Formato de correo electrónico inválido',
    'Rate limit exceeded': 'Límite de intentos excedido. Intenta más tarde',
    'Something wrong with the service role': 'Error en el servicio de autenticación',
    'DB error': 'Error en la base de datos',
    'Auth api rate limit exceeded': 'Demasiados intentos. Intenta más tarde',
    'Service not available': 'Servicio no disponible temporalmente'
  };

  return errorTranslations[errorMessage] || `Error: ${errorMessage}`;
};

export default function Auth() {
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Antes de intentar registrar, verificar si el usuario ya existe
      if (!isLogin) {
        // Verificar si el correo ya está registrado
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email.toLowerCase())
          .maybeSingle();
        
        // Verificar también si hay una cuenta en auth pero no está vinculada a un perfil
        const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false }
        });
        
        // Si hay resultados, el usuario ya existe
        if (userData || (authData && !authError)) {
          throw new Error('User already registered');
        }
      }
      
      let response;
      if (isLogin) {
        response = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        // Al registrarse, guardar credenciales en localStorage para auto-login después
        localStorage.setItem('pendingAuthEmail', email);
        localStorage.setItem('pendingAuthPassword', password);
        
        response = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/auth/callback'
          }
        });
      }

      if (response.error) {
        // Si el error es que el usuario ya existe
        if (response.error.message.includes('already registered') || 
            response.error.message.includes('already been registered')) {
          throw new Error('User already registered');
        }
        throw response.error;
      }
      
      if (!isLogin) {
        toast.success(
          '¡Cuenta creada correctamente! Por favor revisa tu correo electrónico para confirmar tu cuenta. Serás automáticamente conectado después de la verificación.',
          { autoClose: 8000 }
        );
        
        setRegistrationComplete(true);
      }
    } catch (error) {
      // Resaltar específicamente el error de "Usuario ya registrado"
      if (error.message.includes('already registered')) {
        toast.error('Este correo ya está registrado. Intenta iniciar sesión.');
        // Cambia automáticamente al modo de inicio de sesión
        setIsLogin(true);
      } else {
        toast.error(translateAuthError(error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }
    
    try {
      setLoading(true);
      
      // Modificar el enlace de redirección para asegurar que el proceso es correcto
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      setResetEmailSent(true);
      toast.success('Se ha enviado un enlace para restablecer tu contraseña. Por favor, revisa tu correo.');
    } catch (error) {
      toast.error(translateAuthError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // Limpiar cualquier token o sesión pendiente
    localStorage.removeItem('pendingPasswordReset');
    localStorage.removeItem('pendingAuthEmail');
    localStorage.removeItem('pendingAuthPassword');
    
    setForgotPassword(false);
    setResetEmailSent(false);
  };

  // Renderizado condicional para la recuperación de contraseña
  if (forgotPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Recuperar Contraseña
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sistema de Seguimiento Académico
            </p>
          </div>
          
          {resetEmailSent ? (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-md font-semibold text-blue-700 mb-2">Correo enviado</h3>
              <p className="text-sm text-blue-600 mb-2">
                Se ha enviado un correo electrónico a <strong>{email}</strong> con instrucciones para restablecer tu contraseña.
              </p>
              <p className="text-sm text-blue-600">
                Por favor revisa tu bandeja de entrada (y la carpeta de spam) y sigue las instrucciones del correo.
              </p>
              <button 
                onClick={handleBackToLogin}
                className="mt-4 w-full py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ingresa tu correo electrónico"
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Seguimiento Académico
          </p>
        </div>
        
        {registrationComplete ? (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-md font-semibold text-blue-700 mb-2">Verificación pendiente</h3>
            <p className="text-sm text-blue-600 mb-2">
              Se ha enviado un correo electrónico a <strong>{email}</strong> con un enlace de verificación.
            </p>
            <p className="text-sm text-blue-600">
              Por favor revisa tu bandeja de entrada (y la carpeta de spam) para completar la verificación.
              No podrás acceder al sistema hasta verificar tu correo electrónico.
            </p>
            <button 
              onClick={() => {
                setRegistrationComplete(false);
                setIsLogin(true);
              }}
              className="mt-4 w-full py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {isLogin && (
                  <div className="mt-1 text-right">
                    <button 
                      type="button" 
                      onClick={() => setForgotPassword(true)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            </div>
          </form>
        )}
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isLogin ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Iniciar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
