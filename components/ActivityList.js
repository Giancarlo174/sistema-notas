import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSort, FaCopy } from 'react-icons/fa';
import ActivityForm from './ActivityForm';
import ConfirmationModal from './ConfirmationModal';
import { calculatePercentage, assignLetterGrade, getStatusClass } from '../utils/gradeUtils';
import useUIState from '../hooks/useUIState';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';

export default function ActivityList({ activities, categoryId, onUpdateActivity, onDeleteActivity }) {
  const supabase = useSupabaseClient();
  const [editingActivity, setEditingActivity] = useUIState(`editing_activity_${categoryId}`, null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '', categoryId: null });
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [isDuplicatingActivities, setIsDuplicatingActivities] = useState(false);
  const [confirmMultiDelete, setConfirmMultiDelete] = useState(false);

  const [sortOrder, setSortOrder] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedOrder = localStorage.getItem(`activity_sort_order_${categoryId}`);
      return savedOrder || 'newest';
    }
    return 'newest';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`activity_sort_order_${categoryId}`, sortOrder);
    }
  }, [sortOrder, categoryId]);

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

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

  const handleDuplicateActivities = async () => {
    try {
      setIsDuplicatingActivities(true);

      const activitiesToDuplicate = activities.filter(act => selectedActivities.includes(act.id));

      const duplicatingToast = toast.info(
        `Duplicando ${activitiesToDuplicate.length} actividad(es)... Por favor espera.`,
        { autoClose: false }
      );

      for (const activity of activitiesToDuplicate) {
        const { error } = await supabase
          .from('activities')
          .insert([{
            category_id: categoryId,
            name: `${activity.name} (copia)`,
            max_score: activity.max_score,
            obtained_score: activity.obtained_score,
            is_pending: activity.is_pending
          }]);

        if (error) throw error;
      }

      toast.dismiss(duplicatingToast);
      toast.success(`${activitiesToDuplicate.length} actividad(es) duplicadas con éxito`);

      window.location.reload();

    } catch (error) {
      toast.error('Error duplicando actividades: ' + error.message);
    } finally {
      setIsDuplicatingActivities(false);
      setSelectedActivities([]);
    }
  };

  const handleDeleteMultipleActivities = async () => {
    try {
      const activitiesToDelete = activities.filter(act => selectedActivities.includes(act.id));
      
      // Cierra modal inmediatamente para mejor UX
      setConfirmMultiDelete(false);
      
      // Mostrar toast de "eliminando"
      const deletingToast = toast.info(
        `Eliminando ${activitiesToDelete.length} actividad(es)...`,
        { autoClose: false }
      );
      
      // Actualizar estado local primero para reflejo inmediato en UI
      const remainingActivities = sortedActivities.filter(
        activity => !selectedActivities.includes(activity.id)
      );
      
      // Para cada actividad a eliminar
      for (const activity of activitiesToDelete) {
        await onDeleteActivity(activity.id, categoryId);
      }
      
      // Enviar evento explícito para actualizar UI
      window.dispatchEvent(new CustomEvent('forceDataRefresh', {
        detail: { timestamp: Date.now() }
      }));
      
      // Limpiar selección
      setSelectedActivities([]);
      
      // Actualizar UI con las actividades restantes
      toast.dismiss(deletingToast);
      toast.success(`${activitiesToDelete.length} actividad(es) eliminadas con éxito`);
      
      // Forzar recarga de datos después de 500ms para asegurar sincronización
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      toast.error('Error eliminando actividades: ' + error.message);
      window.location.reload();
    }
  };

  const handleSelectActivity = (activityId) => {
    if (selectedActivities.includes(activityId)) {
      setSelectedActivities(selectedActivities.filter(id => id !== activityId));
    } else {
      setSelectedActivities([...selectedActivities, activityId]);
    }
  };

  const handleSelectAllActivities = () => {
    if (selectedActivities.length === sortedActivities.length) {
      setSelectedActivities([]);
    } else {
      setSelectedActivities(sortedActivities.map(a => a.id));
    }
  };

  return (
    <div className="mt-2 overflow-hidden rounded-md border border-gray-200">
      <div className="p-2 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center">
          {selectedActivities.length > 0 ? (
            <div className="flex space-x-2">
              <button
                onClick={handleDuplicateActivities}
                disabled={isDuplicatingActivities}
                className={`flex items-center px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700 ${
                  isDuplicatingActivities ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isDuplicatingActivities ? (
                  <>
                    <svg className="w-3 h-3 mr-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Duplicando...
                  </>
                ) : (
                  <>
                    <FaCopy className="mr-1" /> Duplicar {selectedActivities.length}
                  </>
                )}
              </button>
              <button
                onClick={() => setConfirmMultiDelete(true)}
                className="flex items-center px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
              >
                <FaTrash className="mr-1" /> Eliminar {selectedActivities.length}
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedActivities.length === sortedActivities.length && sortedActivities.length > 0}
                onChange={handleSelectAllActivities}
                className="w-3 h-3 mr-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="text-xs text-gray-500">Seleccionar todas</label>
            </div>
          )}
        </div>

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
                <div className="flex items-center">
                  <input 
                    type="checkbox"
                    checked={selectedActivities.length === sortedActivities.length && sortedActivities.length > 0}
                    onChange={handleSelectAllActivities}
                    className="w-3 h-3 mr-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  Actividad
                </div>
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
              const isSelected = selectedActivities.includes(activity.id);

              return (
                <tr key={activity.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectActivity(activity.id)}
                        className="w-3 h-3 mr-2 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="font-medium text-gray-900">{activity.name}</div>
                    </div>
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

      <ConfirmationModal
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, id: null, name: '', categoryId: null })}
        onConfirm={() => onDeleteActivity(confirmDelete.id, confirmDelete.categoryId)}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar la actividad "${confirmDelete.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={confirmMultiDelete}
        onClose={() => setConfirmMultiDelete(false)}
        onConfirm={handleDeleteMultipleActivities}
        title="Confirmar eliminación múltiple"
        message={`¿Estás seguro de eliminar ${selectedActivities.length} actividad(es)? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
