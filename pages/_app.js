import { useState, useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { ToastContainer } from 'react-toastify';
import CustomHead from '../components/CustomHead';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [supabase] = useState(() => createPagesBrowserClient());
  
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <CustomHead />
      <Component {...pageProps} />
      <ToastContainer position="bottom-right" />
    </SessionContextProvider>
  );
}

export default MyApp;
