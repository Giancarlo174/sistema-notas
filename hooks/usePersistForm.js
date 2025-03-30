import { useState, useEffect, useRef } from 'react';

export default function usePersistForm(formKey, initialValues = {}, formType = 'generic') {
  const storageKey = `form_${formType}_${formKey}`;
  const visibilityChangedRef = useRef(false);
  
  // Añade una lista de campos que no deben persistirse
  const sensitiveFields = ['password', 'token', 'secret', 'auth', 'credential'];

  // Recuperar datos guardados o usar valores iniciales
  const getSavedValue = () => {
    if (typeof window === 'undefined') return initialValues;
    try {
      const item = localStorage.getItem(storageKey);
      if (item) {
        const parsed = JSON.parse(item);
        return parsed;
      }
      return initialValues;
    } catch (e) {
      console.error('Error recuperando formulario:', e);
      return initialValues;
    }
  };

  const [formData, setFormData] = useState(getSavedValue);
  
  // Cuando guardes en localStorage, filtra campos sensibles
  const saveToStorage = (key, data) => {
    // Si el objeto tiene algún campo sensible, no lo guardes completo
    const hasSensitiveData = Object.keys(data).some(field => 
      sensitiveFields.some(sensitive => field.toLowerCase().includes(sensitive))
    );
    
    if (hasSensitiveData) {
      // Crea una copia filtrada sin los campos sensibles
      const safeData = { ...data };
      Object.keys(safeData).forEach(field => {
        if (sensitiveFields.some(sensitive => field.toLowerCase().includes(sensitive))) {
          delete safeData[field];
        }
      });
      localStorage.setItem(key, JSON.stringify(safeData));
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  // Guardar en localStorage cada vez que cambian los datos
  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveToStorage(storageKey, formData);
    }
  }, [formData, storageKey]);
  
  // Manejar cambios de visibilidad de la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Al ocultar la pestaña, guardar estado actual
        saveToStorage(storageKey, formData);
        visibilityChangedRef.current = true;
      } else if (document.visibilityState === 'visible' && visibilityChangedRef.current) {
        // Al regresar a la pestaña, recuperar estado guardado
        try {
          const savedItem = localStorage.getItem(storageKey);
          if (savedItem) {
            setFormData(JSON.parse(savedItem));
          }
        } catch (e) {
          console.error('Error recuperando datos del formulario:', e);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Garantizar que el evento beforeunload siempre guarde datos
    const handleBeforeUnload = () => {
      saveToStorage(storageKey, formData);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [storageKey, formData]);

  // Función explícita para resetear el formulario (usado en cancelar)
  const resetForm = () => {
    localStorage.removeItem(storageKey);
    setFormData(initialValues);
  };

  return [formData, setFormData, resetForm];
}
