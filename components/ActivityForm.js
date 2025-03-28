import { useState } from 'react';

export default function ActivityForm({ category, onSubmit, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    max_score: initialData?.max_score || 100,
    obtained_score: initialData?.obtained_score || '',
    is_pending: initialData ? initialData.is_pending : false
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? '' : parseFloat(value)) : 
              value
    });
    
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
      newErrors.name = 'El nombre de la actividad es requerido';
    }
    
    if (!formData.max_score || formData.max_score <= 0) {
      newErrors.max_score = 'La nota máxima debe ser mayor a 0';
    }
    
    if (!formData.is_pending) {
      if (formData.obtained_score === '') {
        newErrors.obtained_score = 'La nota obtenida es requerida si la actividad está completada';
      } else if (formData.obtained_score < 0) {
        newErrors.obtained_score = 'La nota obtenida no puede ser negativa';
      } else if (formData.obtained_score > formData.max_score) {
        newErrors.obtained_score = `La nota obtenida no puede ser mayor que la nota máxima (${formData.max_score})`;
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Prepare final data
    const finalData = {
      ...formData,
      obtained_score: formData.is_pending ? null : formData.obtained_score
    };
    
    const success = await onSubmit(finalData);
    if (success) {
      setFormData({
        name: '',
        max_score: 100,
        obtained_score: '',
        is_pending: false 
      });
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-bold">
          {initialData ? 'Editar Actividad' : 'Agregar Actividad'}
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Categoría: {category.name} ({category.percentage}%)
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
              Nombre de la actividad
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Parcial 1"
              className={`block w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          <div className="mb-4">
            <label htmlFor="max_score" className="block mb-2 text-sm font-medium text-gray-700">
              Nota máxima
            </label>
            <input
              type="number"
              id="max_score"
              name="max_score"
              min="1"
              step="0.01"
              value={formData.max_score}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border ${errors.max_score ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.max_score && <p className="mt-1 text-sm text-red-600">{errors.max_score}</p>}
            <p className="mt-1 text-sm text-gray-500">
              Puntos totales que vale esta actividad
            </p>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_pending"
                name="is_pending"
                checked={formData.is_pending}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is_pending" className="block ml-2 text-sm text-gray-700">
                Actividad pendiente (aún no calificada)
              </label>
            </div>
          </div>
          
          {!formData.is_pending && (
            <div className="mb-4">
              <label htmlFor="obtained_score" className="block mb-2 text-sm font-medium text-gray-700">
                Nota obtenida
              </label>
              <input
                type="number"
                id="obtained_score"
                name="obtained_score"
                min="0"
                step="0.01"
                max={formData.max_score}
                value={formData.obtained_score}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${errors.obtained_score ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors.obtained_score && <p className="mt-1 text-sm text-red-600">{errors.obtained_score}</p>}
              <p className="mt-1 text-sm text-gray-500">
                Puntos obtenidos en esta actividad (máximo: {formData.max_score})
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {initialData ? 'Guardar Cambios' : 'Agregar Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
