import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import Auth from '../components/Auth';
import Dashboard from '../components/Dashboard';
import CustomHead from '../components/CustomHead';

export default function Home() {
  const session = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [session]);

  return (
    <>
      <CustomHead title="Sistema de Seguimiento Académico" />
      <div className="min-h-screen bg-gray-100">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">Cargando...</div>
        ) : (
          !session ? <Auth /> : <Dashboard />
        )}
      </div>
    </>
  );
}
