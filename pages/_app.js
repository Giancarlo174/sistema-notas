import { useState, useEffect } from 'react';
// Reemplazar esta importación
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Actualizar esta línea
  const [supabase] = useState(() => createPagesBrowserClient());
  
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <Component {...pageProps} />
      <ToastContainer position="bottom-right" />
    </SessionContextProvider>
  );
}

export default MyApp;
