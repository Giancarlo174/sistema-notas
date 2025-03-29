import { useState } from 'react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // Usar nuestra API route en lugar de Supabase directamente
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Evitar almacenar credenciales en localStorage
      // NO guardar email ni password en localStorage ni en ninguna variable global
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }
      
      // Limpiar los campos después del envío exitoso
      setEmail('');
      setPassword('');
      
      // Redirigir o actualizar la UI según sea necesario
      window.location.href = '/dashboard';
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Redirigir al inicio después de cerrar sesión
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  // ...existing code...
};

export default Auth;
