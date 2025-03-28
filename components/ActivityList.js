import { useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import ActivityForm from './ActivityForm';
import ConfirmationModal from './ConfirmationModal';
import { calculatePercentage, assignLetterGrade, getStatusClass } from '../utils/gradeUtils';

export default function ActivityList({ activities, categoryId, onUpdateActivity, onDeleteActivity }) {
  const [editingActivity, setEditingActivity] = useState(null);
  // Estado para el modal de confirmación
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '', categoryId: null });
  
  // Función para mostrar el modal de confirmación
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
            {activities.map((activity) => {
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
