import React, { createContext, useContext, useState, useEffect } from 'react';

const FormContext = createContext();

export function useFormContext() {
  return useContext(FormContext);
}

export function FormProvider({ children }) {
  // Estado para almacenar qué formularios están abiertos
  const [openForms, setOpenForms] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('open_forms_state');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Guardar estado en localStorage cuando cambia
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('open_forms_state', JSON.stringify(openForms));
    
    // Esto es crítico: sincronizar estado entre pestañas del mismo origen
    const handleStorage = (e) => {
      if (e.key === 'open_forms_state') {
        try {
          const newState = JSON.parse(e.newValue);
          if (newState) setOpenForms(newState);
        } catch (err) {
          console.error('Error parsing forms state:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [openForms]);

  // Detectar cambios de visibilidad para sincronizar estado
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const saved = localStorage.getItem('open_forms_state');
          if (saved) {
            setOpenForms(JSON.parse(saved));
          }
        } catch (e) {
          console.error('Error sincronizando estado de formularios:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Funciones para manipular el estado
  const isFormOpen = (formId) => !!openForms[formId];
  
  const openForm = (formId) => {
    setOpenForms(prev => {
      const newState = { ...prev, [formId]: true };
      // Guardar inmediatamente para sincronizar entre componentes
      if (typeof window !== 'undefined') {
        localStorage.setItem('open_forms_state', JSON.stringify(newState));
      }
      return newState;
    });
  };
  
  const closeForm = (formId) => {
    setOpenForms(prev => {
      const newState = { ...prev };
      delete newState[formId];
      // Guardar inmediatamente para sincronizar entre componentes
      if (typeof window !== 'undefined') {
        localStorage.setItem('open_forms_state', JSON.stringify(newState));
      }
      return newState;
    });
  };

  return (
    <FormContext.Provider value={{ isFormOpen, openForm, closeForm, openForms }}>
      {children}
    </FormContext.Provider>
  );
}
