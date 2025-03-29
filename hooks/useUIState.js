import { useState, useEffect } from 'react';

/**
 * Hook para persistir estados de UI entre cambios de pestañas
 * @param {string} stateKey - Identificador único para este estado UI
 * @param {any} initialState - Estado inicial
 * @returns {[any, Function]} - [estado actual, función para actualizar estado]
 */
export default function useUIState(stateKey, initialState = null) {
  // Recuperar estado guardado o usar el inicial
  const getInitialState = () => {
    try {
      if (typeof window === 'undefined') return initialState;
      
      const savedState = localStorage.getItem(`ui_state_${stateKey}`);
      return savedState ? JSON.parse(savedState) : initialState;
    } catch (error) {
      console.error('Error recuperando estado UI:', error);
      return initialState;
    }
  };

  const [state, setState] = useState(getInitialState);

  // Persistir cambios de estado
  useEffect(() => {
    // Guardar el estado actual en localStorage cuando cambia
    if (state !== null && typeof window !== 'undefined') {
      localStorage.setItem(`ui_state_${stateKey}`, JSON.stringify(state));
    }
    
    const handleVisibilityChange = () => {
      // Al volver a la pestaña, verificar si hay un estado más reciente
      if (document.visibilityState === 'visible') {
        const currentState = localStorage.getItem(`ui_state_${stateKey}`);
        if (currentState) {
          try {
            const parsedState = JSON.parse(currentState);
            setState(parsedState);
          } catch (e) {
            console.error('Error al analizar estado guardado:', e);
          }
        }
      }
    };

    // Escuchar cambios de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stateKey, state]);

  // Función para actualizar el estado
  const updateState = (newState) => {
    const valueToStore = typeof newState === 'function' 
      ? newState(state)
      : newState;
    
    setState(valueToStore);
    
    // Guardar inmediatamente en localStorage
    if (typeof window !== 'undefined') {
      if (valueToStore === null) {
        localStorage.removeItem(`ui_state_${stateKey}`);
      } else {
        localStorage.setItem(`ui_state_${stateKey}`, JSON.stringify(valueToStore));
      }
    }
  };

  return [state, updateState];
}
