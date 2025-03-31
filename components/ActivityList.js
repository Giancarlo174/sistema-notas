import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSort } from 'react-icons/fa';
import ActivityForm from './ActivityForm';
import ConfirmationModal from './ConfirmationModal';
import { calculatePercentage, assignLetterGrade, getStatusClass } from '../utils/gradeUtils';
import useUIState from '../hooks/useUIState';

export default function ActivityList({ activities, categoryId, onUpdateActivity, onDeleteActivity }) {
  const [editingActivity, setEditingActivity] = useUIState(`editing_activity_${categoryId}`, null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '', categoryId: null });
  
  // Nuevo estado para controlar el ordenamiento de actividades
  const [sortOrder, setSortOrder] = useState(() => {
    // Recuperar preferencia de orden del localStorage
    if (typeof window !== 'undefined') {
      const savedOrder = localStorage.getItem(`activity_sort_order_${categoryId}`);
      return savedOrder || 'newest'; // Por defecto, mostrar las más nuevas primero
    }
    return 'newest';
  });
  
  // Guardar preferencia de ordenamiento en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`activity_sort_order_${categoryId}`, sortOrder);
    }
  }, [sortOrder, categoryId]);

  // Función para manejar el cambio de orden
  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  // Ordenar actividades según la preferencia del usuario
  const sortedActivities = [...activities].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    } else if (sortOrder === 'oldest') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    } else if (sortOrder === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (sortOrder === 'score_desc') {
      const scoreA = (a.is_pending ? 0 : calculatePercentage(a.obtained_score, a.max_score));
      const scoreB = (b.is_pending ? 0 : calculatePercentage(b.obtained_score, b.max_score));
      return scoreB - scoreA;
    } else if (sortOrder === 'score_asc') {
      const scoreA = (a.is_pending ? 100 : calculatePercentage(a.obtained_score, a.max_score));
      const scoreB = (b.is_pending ? 100 : calculatePercentage(b.obtained_score, b.max_score));
      return scoreA - scoreB;
    }
    return 0;
  });
  
  const showDeleteConfirmation = (activity) => {
    setConfirmDelete({
      show: true,
      id: activity.id,
      name: activity.name,
      categoryId: categoryId
    });
  };

  return (
    <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
      <div className="p-2 bg-gray-50 flex items-center justify-end">
        <div className="flex items-center">
          <FaSort className="mr-2 text-gray-500" />
          <select 
            value={sortOrder}
            onChange={handleSortChange}
            className="block text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="alphabetical">Alfabético</option>
            <option value="score_desc">Mayor puntuación</option>
            <option value="score_asc">Menor puntuación</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Actividad
              </th>
              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Nota
              </th>
              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                %
              </th>
              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Estado
              </th>
              <th scope="col" className="px-3 py-2 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedActivities.map((activity) => {
              const isPending = activity.is_pending;
              const percentage = isPending ? 0 : calculatePercentage(activity.obtained_score, activity.max_score);
              const { letter, status } = isPending ? { letter: 'N/A', status: 'Pendiente' } : assignLetterGrade(percentage);
              const statusClass = getStatusClass(letter);
              
              return (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{activity.name}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isPending ? (
                      <span className="text-gray-500">⏳ Pendiente</span>
                    ) : (
                      <div className="text-gray-900">
                        {activity.obtained_score} / {activity.max_score}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isPending ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      <div className="text-gray-900">{percentage.toFixed(1)}%</div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isPending ? (
                      <span className="text-gray-500">Pendiente</span>
                    ) : (
                      <div className={statusClass}>
                        {letter} - {status}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingActivity(activity)}
                        className="p-1 text-gray-500 rounded hover:bg-gray-100 hover:text-indigo-600"
                        title="Editar actividad"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => showDeleteConfirmation(activity)}
                        className="p-1 text-gray-500 rounded hover:bg-gray-100 hover:text-red-600"
                        title="Eliminar actividad"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Modal para editar actividad */}
      {editingActivity && (
        <ActivityForm
          category={{ id: categoryId }}
          initialData={editingActivity}
          onSubmit={(data) => {
            const result = onUpdateActivity(editingActivity.id, categoryId, data);
            if (result) setEditingActivity(null);
            return result;
          }}
          onCancel={() => setEditingActivity(null)}
        />
      )}

      {/* Modal de confirmación para eliminar actividad */}
      <ConfirmationModal
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, id: null, name: '', categoryId: null })}
        onConfirm={() => onDeleteActivity(confirmDelete.id, confirmDelete.categoryId)}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar la actividad "${confirmDelete.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
