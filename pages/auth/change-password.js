import { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import Link from 'next/link';

export default function ChangePassword() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [changeComplete, setChangeComplete] = useState(false);

  const validateForm = () => {
    if (!currentPassword) {
      setError('Por favor ingresa tu contraseña actual');
      return false;
    }
    
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return false;
    }
    
    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Primero verificamos la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      
      if (signInError) {
        setError('Contraseña actual incorrecta');
        return;
      }
      
      // Luego actualizamos la contraseña
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setChangeComplete(true);
      toast.success('Contraseña actualizada con éxito');
      
      // Limpiar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Error al cambiar la contraseña: ' + error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Cambiar contraseña - Sistema Académico">
      <div className="container max-w-md mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <FaLock className="mx-auto text-indigo-600 text-4xl mb-2" />
            <h1 className="text-2xl font-bold text-gray-800">Cambiar contraseña</h1>
            <p className="text-gray-600 text-sm mt-1">Actualiza tu contraseña para mantener tu cuenta segura</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {changeComplete ? (
            <div className="text-center">
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                Tu contraseña ha sido cambiada con éxito.
              </div>
              <Link href="/" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Volver al inicio
              </Link>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block mb-2 text-sm font-medium text-gray-700">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-gray-700">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-700">
                  Confirmar nueva contraseña
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
                disabled={loading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
              
              <div className="text-center mt-4">
                <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Cancelar y volver al inicio
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
