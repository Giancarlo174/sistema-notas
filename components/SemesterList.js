import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaEdit, FaTrash, FaBook, FaEllipsisV } from 'react-icons/fa';
import SemesterForm from './SemesterForm';
import ConfirmationModal from './ConfirmationModal';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import useUIState from '../hooks/useUIState';

export default function SemesterList({ 
  semesters, 
  onDelete, 
  selectedSemesters,
  setSelectedSemesters
}) {
  const supabase = useSupabaseClient();
  const [editingSemester, setEditingSemester] = useUIState('editing_semester', null);
  const [menuOpen, setMenuOpen] = useUIState('semester_menu_open', null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '' });
  const menuRef = useRef(null);

  const handleEdit = (semester) => {
    setEditingSemester(semester);
    setMenuOpen(null);
  };

  const handleUpdate = async (name) => {
    try {
      const { error } = await supabase
        .from('semesters')
        .update({ name })
        .eq('id', editingSemester.id);
      
      if (error) throw error;
      
      const updatedSemesters = semesters.map(sem => 
        sem.id === editingSemester.id ? { ...sem, name } : sem
      );
      
      toast.success('Semestre actualizado con éxito');
      setEditingSemester(null);
    } catch (error) {
      toast.error('Error actualizando semestre: ' + error.message);
    }
  };

  const toggleMenu = (id) => {
    setMenuOpen(menuOpen === id ? null : id);
  };

  const showDeleteConfirmation = (semester) => {
    setConfirmDelete({ 
      show: true, 
      id: semester.id, 
      name: semester.name 
    });
    setMenuOpen(null);
  };

  const handleCheckboxChange = (semesterId) => {
    if (selectedSemesters.includes(semesterId)) {
      setSelectedSemesters(selectedSemesters.filter(id => id !== semesterId));
    } else {
      setSelectedSemesters([...selectedSemesters, semesterId]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target) && menuOpen) {
        setMenuOpen(null);
      }
    }
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {semesters.map((semester) => (
        <div key={semester.id} className={`relative p-4 bg-white rounded-lg shadow-md ${selectedSemesters.includes(semester.id) ? 'ring-2 ring-indigo-500' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedSemesters.includes(semester.id)}
                onChange={() => handleCheckboxChange(semester.id)}
                className="w-4 h-4 mr-2 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <h3 className="text-lg font-medium">{semester.name}</h3>
            </div>
            <button 
              onClick={() => toggleMenu(semester.id)}
              className="p-1 text-gray-400 rounded-full hover:bg-gray-100"
            >
              <FaEllipsisV />
            </button>
            
            {menuOpen === semester.id && (
              <div 
                ref={menuRef}
                className="absolute right-0 z-10 w-48 mt-2 bg-white rounded-md shadow-lg top-10 border border-gray-200"
              >
                <div className="py-1">
                  <button
                    onClick={() => handleEdit(semester)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FaEdit className="mr-2" /> Editar
                  </button>
                  <button
                    onClick={() => showDeleteConfirmation(semester)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <FaTrash className="mr-2" /> Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <Link href={`/semester/${semester.id}`} className="flex items-center justify-center p-3 mt-2 text-white bg-indigo-500 rounded-md hover:bg-indigo-600">
            <FaBook className="mr-2" /> Ver Materias
          </Link>
        </div>
      ))}
      
      {editingSemester && (
        <SemesterForm
          initialData={editingSemester}
          onSubmit={handleUpdate}
          onCancel={() => setEditingSemester(null)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, id: null, name: '' })}
        onConfirm={() => onDelete(confirmDelete.id)}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar el semestre "${confirmDelete.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}

