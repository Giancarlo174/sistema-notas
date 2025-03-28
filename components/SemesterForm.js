import { useState } from 'react';

export default function SemesterForm({ onSubmit, onCancel, initialData }) {
  const [name, setName] = useState(initialData?.name || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre del semestre no puede estar vacío');
      return;
    }
    
    onSubmit(name);
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-xl font-bold">
          {initialData ? 'Editar Semestre' : 'Crear Nuevo Semestre'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="semesterName" className="block mb-2 text-sm font-medium text-gray-700">
              Nombre del Semestre
            </label>
            <input
              type="text"
              id="semesterName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: 2025-I"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          
          <div className="flex justify-end space-x-3">
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
              {initialData ? 'Guardar Cambios' : 'Crear Semestre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
