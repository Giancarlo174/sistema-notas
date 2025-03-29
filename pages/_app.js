import { useState } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { ToastContainer } from 'react-toastify';
import CustomHead from '../components/CustomHead';
import { FormProvider } from '../contexts/FormContext';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [supabase] = useState(() => createPagesBrowserClient());
  
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <FormProvider>
        <CustomHead />
        <Component {...pageProps} />
        <ToastContainer position="bottom-right" />
      </FormProvider>
    </SessionContextProvider>
  );
}

export default MyApp;
