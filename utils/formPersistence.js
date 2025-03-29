/**
 * Utilidades para manejar la persistencia de formularios entre cambios de pestaña
 */

// Guardar datos del formulario por tipo
export const saveFormData = (type, key, data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`form_${type}_${key}`, JSON.stringify(data));
};

// Recuperar datos del formulario por tipo
export const getFormData = (type, key, defaultValue = {}) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(`form_${type}_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error retrieving form data for ${type}_${key}:`, e);
    return defaultValue;
  }
};

// Limpiar datos del formulario por tipo
export const clearFormData = (type, key) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`form_${type}_${key}`);
};

// Saber si hay datos guardados para un formulario
export const hasFormData = (type, key) => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(`form_${type}_${key}`);
};
