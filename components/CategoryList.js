import { useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import CategoryForm from './CategoryForm';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import ConfirmationModal from './ConfirmationModal';
import { calculateCategoryContribution } from '../utils/gradeUtils';
import { useFormContext } from '../contexts/FormContext';

export default function CategoryList({
  categories,
  activities,
  onUpdateCategory,
  onDeleteCategory,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onDeleteMultipleCategories // Nueva prop
}) {
  const { isFormOpen, openForm, closeForm } = useFormContext();
  const [expandedCategories, setExpandedCategories] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('expanded_categories');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [confirmMultiDelete, setConfirmMultiDelete] = useState(false);

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allFilteredSelected = filteredCategories.length > 0 && 
    filteredCategories.every(cat => selectedCategories.includes(cat.id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedCategories(prevSelected => 
        prevSelected.filter(id => !filteredCategories.some(cat => cat.id === id))
      );
    } else {
      const filteredIds = filteredCategories.map(cat => cat.id);
      setSelectedCategories(prevSelected => {
        const newSelected = [...prevSelected];
        filteredIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };

  const handleSelectCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleDeleteMultipleCategories = () => {
    // Llama a la función pasada desde el padre
    onDeleteMultipleCategories(selectedCategories);
    
    // Limpiar la selección y cerrar el modal
    setSelectedCategories([]);
    setConfirmMultiDelete(false);
  };

  const getCurrentTotal = (excludeCategoryId = null) => {
    return categories.reduce((sum, cat) => {
      if (excludeCategoryId && cat.id === excludeCategoryId) return sum;
      return sum + cat.percentage;
    }, 0);
  };

  const toggleCategoryExpand = (categoryId) => {
    const newState = {
      ...expandedCategories,
      [categoryId]: !expandedCategories[categoryId]
    };
    setExpandedCategories(newState);
    localStorage.setItem('expanded_categories', JSON.stringify(newState));
  };

  const showDeleteConfirmation = (category) => {
    setConfirmDelete({
      show: true,
      id: category.id,
      name: category.name
    });
  };

  const handleEditCategory = (category) => {
    openForm(`edit_category_${category.id}`);
  };

  const handleAddActivity = (category) => {
    openForm(`add_activity_${category.id}`);
    const newState = {
      ...expandedCategories,
      [category.id]: true
    };
    setExpandedCategories(newState);
    localStorage.setItem('expanded_categories', JSON.stringify(newState));
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-lg shadow mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <FaSearch className="absolute top-3 left-3 text-gray-400" />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="selectAllCategories"
                checked={allFilteredSelected && filteredCategories.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="selectAllCategories" className="ml-2 text-sm text-gray-700">
                Seleccionar todos
              </label>
            </div>
            
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setConfirmMultiDelete(true)}
                className="flex items-center px-3 py-1 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <FaTrash className="mr-1" /> Eliminar {selectedCategories.length}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {filteredCategories.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-lg shadow">
          <p className="text-gray-600">
            {searchTerm 
              ? `No se encontraron categorías que coincidan con "${searchTerm}".` 
              : "No hay categorías definidas en esta materia."
            }
          </p>
        </div>
      ) : (
        filteredCategories.map(category => {
          const categoryActivities = activities[category.id] || [];
          const contribution = calculateCategoryContribution(category, categoryActivities);
          const pendingActivities = category.calculation_mode === 'fixed' 
            ? category.total_activities - categoryActivities.length
            : null;
          const isExpanded = expandedCategories[category.id] || false;
          const isSelected = selectedCategories.includes(category.id);

          return (
            <div key={category.id} className={`p-4 bg-white rounded-lg shadow ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectCategory(category.id)}
                    className="w-4 h-4 mr-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{category.name}</h3>
                    <div className="flex flex-wrap items-center mt-1 text-sm text-gray-600">
                      <span className="mr-3">{category.percentage}% de la nota final</span>
                      <span className="mr-3">•</span>
                      <span>
                        Modo: {category.calculation_mode === 'dynamic' ? 'Dinámico' : 'Fijo'}
                        {category.calculation_mode === 'fixed' && ` (${category.total_activities} actividades)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 text-gray-500 rounded hover:bg-gray-100 hover:text-indigo-600"
                    title="Editar categoría"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => showDeleteConfirmation(category)}
                    className="p-1 text-gray-500 rounded hover:bg-gray-100 hover:text-red-600"
                    title="Eliminar categoría"
                  >
                    <FaTrash />
                  </button>
                  <button
                    onClick={() => toggleCategoryExpand(category.id)}
                    className="p-1 ml-1 text-gray-500 rounded hover:bg-gray-100"
                    title={isExpanded ? "Ocultar actividades" : "Mostrar actividades"}
                  >
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>
              </div>

              <div className="p-3 mb-4 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Aporte a la nota final:</span>
                    <span className="ml-2 font-bold">{contribution.toFixed(2)}%</span>
                    <span className="mx-1">de</span>
                    <span>{category.percentage}%</span>
                  </div>

                  <button
                    onClick={() => handleAddActivity(category)}
                    className="flex items-center px-2 py-1 text-xs text-white bg-indigo-600 rounded hover:bg-indigo-700"
                  >
                    <FaPlus className="mr-1" /> Actividad
                  </button>
                </div>

                {category.calculation_mode === 'fixed' && (
                  <div className="mt-1 text-xs text-gray-500">
                    {pendingActivities > 0 ? (
                      <p>Faltan {pendingActivities} actividades por ingresar</p>
                    ) : (
                      <p>Todas las actividades ya han sido ingresadas</p>
                    )}
                  </div>
                )}
              </div>

              {isExpanded && (
                categoryActivities.length > 0 ? (
                  <ActivityList
                    activities={categoryActivities}
                    categoryId={category.id}
                    onUpdateActivity={onUpdateActivity}
                    onDeleteActivity={onDeleteActivity}
                  />
                ) : (
                  <div className="p-3 text-center text-sm text-gray-500 border border-dashed border-gray-300 rounded-md">
                    No hay actividades registradas en esta categoría. Haz clic en "Actividad" para agregar una.
                  </div>
                )
              )}
            </div>
          );
        })
      )}
      
      {categories.map(category => (
        <>
          {isFormOpen(`edit_category_${category.id}`) && (
            <CategoryForm
              initialData={category}
              onSubmit={(data) => {
                const result = onUpdateCategory(category.id, data);
                if (result) closeForm(`edit_category_${category.id}`);
                return result;
              }}
              onCancel={() => closeForm(`edit_category_${category.id}`)}
              currentTotal={getCurrentTotal(category.id)}
            />
          )}
          
          {isFormOpen(`add_activity_${category.id}`) && (
            <ActivityForm
              category={category}
              onSubmit={(data) => {
                const result = onAddActivity(category.id, data);
                if (result) closeForm(`add_activity_${category.id}`);
                return result;
              }}
              onCancel={() => closeForm(`add_activity_${category.id}`)}
            />
          )}
        </>
      ))}
      
      <ConfirmationModal
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, id: null, name: '' })}
        onConfirm={() => onDeleteCategory(confirmDelete.id)}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar la categoría "${confirmDelete.name}"? Se eliminarán también todas las actividades asociadas.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={confirmMultiDelete}
        onClose={() => setConfirmMultiDelete(false)}
        onConfirm={handleDeleteMultipleCategories}
        title="Confirmar eliminación múltiple"
        message={`¿Estás seguro de eliminar ${selectedCategories.length} categoría(s)? Esta acción eliminará también todas las actividades asociadas.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
