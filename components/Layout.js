import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import { FaSignOutAlt, FaGraduationCap, FaTimes, FaUserCog } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CustomHead from './CustomHead';

export default function Layout({ children, title }) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Cerrar el diálogo de confirmación
      setShowLogoutConfirm(false);
      
      // Redireccionar a la página principal
      toast.success('Sesión cerrada correctamente');
      router.push('/');
    } catch (error) {
      toast.error('Error al cerrar sesión: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <CustomHead title={title} />
      <header className="bg-white shadow">
        <div className="container flex items-center justify-between p-4 mx-auto">
          <Link href="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80">
            <FaGraduationCap className="text-2xl text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-800">Seguimiento Académico</h1>
          </Link>
          
          {/* Usuario y menú */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
            >
              <FaUserCog className="mr-2" />
              <span>Mi cuenta</span>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 z-10 w-48 mt-2 bg-white rounded-md shadow-lg border border-gray-200">
                <div className="py-1">
                  <Link href="/auth/change-password" className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100">
                    Cambiar contraseña
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                  >
                    <FaSignOutAlt className="inline mr-2" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container py-6 mx-auto">{children}</main>
      <footer className="bg-white border-t">
        <div className="container p-4 mx-auto text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Sistema de Seguimiento Académico
        </div>
      </footer>
      
      {/* Modal de confirmación para cerrar sesión */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Confirmar cierre de sesión</h3>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <p className="mb-4">¿Estás seguro de que deseas cerrar sesión?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
