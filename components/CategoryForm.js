import { useState, useEffect } from 'react';
import usePersistForm from '../hooks/usePersistForm';

export default function CategoryForm({ onSubmit, onCancel, initialData, currentTotal = 0 }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  const [formData, setFormData, resetForm] = usePersistForm(
    `${initialData?.id || 'new'}`,
    {
      name: initialData?.name || '',
      percentage: initialData?.percentage || 0,
      calculation_mode: initialData?.calculation_mode || 'dynamic',
      total_activities: initialData?.total_activities || 0,
    },
    'category' // Especificar el tipo de formulario
  );
  
  // Marcar como montado después del renderizado inicial
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Guardar datos en localStorage al cambiar de pestaña
  useEffect(() => {
    if (!hasMounted) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Forzar guardado explícito al ocultar la pestaña
        localStorage.setItem(`form_category_${initialData?.id || 'new'}`, 
          JSON.stringify(formData));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasMounted, formData, initialData]);
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la categoría es requerido';
    }
    
    if (!formData.percentage || formData.percentage <= 0) {
      newErrors.percentage = 'El porcentaje debe ser mayor a 0';
    }
    
    if (formData.calculation_mode === 'fixed' && (!formData.total_activities || formData.total_activities <= 0)) {
      newErrors.total_activities = 'Debes especificar el número de actividades';
    }
    
    // Check if adding this percentage would exceed 100%
    const newTotal = currentTotal + (initialData ? formData.percentage - initialData.percentage : formData.percentage);
    if (newTotal > 100) {
      newErrors.percentage = `El total excedería el 100% (${newTotal}%). Máximo disponible: ${100 - currentTotal + (initialData?.percentage || 0)}%`;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const success = await onSubmit(formData);
    if (success) {
      resetForm();
    }
  };

  const handleCancel = () => {
    resetForm(); // Esto limpia los datos de localStorage
    onCancel();
  };

  // Asegurar limpieza al desmontar
  useEffect(() => {
    return () => {
      resetForm();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-bold">
          {initialData ? 'Editar Categoría' : 'Agregar Categoría'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
              Nombre de la categoría
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Parciales"
              className={`block w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          <div className="mb-4">
            <label htmlFor="percentage" className="block mb-2 text-sm font-medium text-gray-700">
              Porcentaje de la nota final
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="percentage"
                name="percentage"
                min="1"
                max="100"
                step="0.01"
                value={formData.percentage}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.percentage ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              <span className="ml-2">%</span>
            </div>
            {errors.percentage ? (
              <p className="mt-1 text-sm text-red-600">{errors.percentage}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                Porcentaje disponible: {100 - currentTotal + (initialData?.percentage || 0)}%
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Modo de cálculo
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="dynamic"
                  name="calculation_mode"
                  value="dynamic"
                  checked={formData.calculation_mode === 'dynamic'}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="dynamic" className="block ml-2 text-sm text-gray-700">
                  Dinámico (promedia sólo actividades ingresadas)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="fixed"
                  name="calculation_mode"
                  value="fixed"
                  checked={formData.calculation_mode === 'fixed'}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="fixed" className="block ml-2 text-sm text-gray-700">
                  Fijo (las actividades tienen un valor fijo)
                </label>
              </div>
            </div>
          </div>
          
          {formData.calculation_mode === 'fixed' && (
            <div className="mb-4">
              <label htmlFor="total_activities" className="block mb-2 text-sm font-medium text-gray-700">
                Número total de actividades
              </label>
              <input
                type="number"
                id="total_activities"
                name="total_activities"
                min="1"
                value={formData.total_activities}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.total_activities ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors.total_activities && <p className="mt-1 text-sm text-red-600">{errors.total_activities}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Cada actividad valdrá {formData.total_activities > 0 ? (formData.percentage / formData.total_activities).toFixed(2) : 0}%
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {initialData ? 'Guardar Cambios' : 'Agregar Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
