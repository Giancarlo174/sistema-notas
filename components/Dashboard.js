import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import SemesterList from './SemesterList';
import SemesterForm from './SemesterForm';
import Layout from './Layout';
import ConfirmationModal from './ConfirmationModal';
import { FaTrash, FaSort, FaCopy } from 'react-icons/fa';

export default function Dashboard() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [confirmMultiDelete, setConfirmMultiDelete] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  const [sortOrder, setSortOrder] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedOrder = localStorage.getItem('semester_sort_order');
      return savedOrder || 'newest';
    }
    return 'newest';
  });

  useEffect(() => {
    if (user) fetchSemesters();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('semester_sort_order', sortOrder);
    }
  }, [sortOrder]);

  async function fetchSemesters() {
    try {
      setLoading(true);
      
      let query = supabase.from('semesters').select('*');
      
      if (sortOrder === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortOrder === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortOrder === 'alphabetical') {
        query = query.order('name', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setSemesters(data || []);
    } catch (error) {
      toast.error('Error cargando semestres: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) fetchSemesters();
  }, [sortOrder]);

  async function addSemester(name) {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .insert([{ name, user_id: user.id }])
        .select();
      
      if (error) throw error;
      
      setSemesters([data[0], ...semesters]);
      setShowSemesterForm(false);
      toast.success('Semestre creado con éxito');
    } catch (error) {
      toast.error('Error creando semestre: ' + error.message);
    }
  }

  async function deleteSemester(id) {
    try {
      const { error } = await supabase
        .from('semesters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSemesters(semesters.filter(sem => sem.id !== id));
      toast.success('Semestre eliminado con éxito');
    } catch (error) {
      toast.error('Error eliminando semestre: ' + error.message);
    }
  }

  async function deleteMultipleSemesters() {
    try {
      for (const semesterId of selectedSemesters) {
        const { error } = await supabase
          .from('semesters')
          .delete()
          .eq('id', semesterId);
        
        if (error) throw error;
      }
      
      setSemesters(semesters.filter(sem => !selectedSemesters.includes(sem.id)));
      setSelectedSemesters([]);
      toast.success('Semestres eliminados con éxito');
    } catch (error) {
      toast.error('Error eliminando semestres: ' + error.message);
    } finally {
      setConfirmMultiDelete(false);
    }
  }

  async function updateSemester(id, name) {
    setSemesters(prevSemesters => 
      prevSemesters.map(sem => 
        sem.id === id ? { ...sem, name } : sem
      )
    );
  }

  async function duplicateSelectedSemesters() {
    try {
      setIsDuplicating(true);
      
      const selectedSemestersData = semesters.filter(sem => selectedSemesters.includes(sem.id));
      const newSemesters = [];
      
      const duplicatingToast = toast.info(
        `Duplicando ${selectedSemestersData.length} semestre(s)... Por favor espera.`,
        { autoClose: false }
      );
      
      for (const semester of selectedSemestersData) {
        const { data: newSemesterData, error: semesterError } = await supabase
          .from('semesters')
          .insert([{ 
            name: `${semester.name} (copia)`, 
            user_id: user.id 
          }])
          .select();
        
        if (semesterError) throw semesterError;
        const newSemester = newSemesterData[0];
        newSemesters.push(newSemester);
        
        const { data: subjects, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .eq('semester_id', semester.id);
        
        if (subjectsError) throw subjectsError;
        
        for (const subject of subjects || []) {
          const { data: newSubjectData, error: newSubjectError } = await supabase
            .from('subjects')
            .insert([{
              semester_id: newSemester.id,
              name: `${subject.name} (copia)`,
              min_passing_grade: subject.min_passing_grade
            }])
            .select();
          
          if (newSubjectError) throw newSubjectError;
          const newSubject = newSubjectData[0];
          
          const { data: categories, error: categoriesError } = await supabase
            .from('categories')
            .select('*')
            .eq('subject_id', subject.id);
          
          if (categoriesError) throw categoriesError;
          
          for (const category of categories || []) {
            const { data: newCategoryData, error: newCategoryError } = await supabase
              .from('categories')
              .insert([{
                subject_id: newSubject.id,
                name: `${category.name} (copia)`,
                percentage: category.percentage,
                calculation_mode: category.calculation_mode,
                total_activities: category.total_activities
              }])
              .select();
            
            if (newCategoryError) throw newCategoryError;
            const newCategory = newCategoryData[0];
            
            const { data: activities, error: activitiesError } = await supabase
              .from('activities')
              .select('*')
              .eq('category_id', category.id);
            
            if (activitiesError) throw activitiesError;
            
            for (const activity of activities || []) {
              const { error: newActivityError } = await supabase
                .from('activities')
                .insert([{
                  category_id: newCategory.id,
                  name: `${activity.name} (copia)`,
                  max_score: activity.max_score,
                  obtained_score: activity.obtained_score,
                  is_pending: activity.is_pending
                }]);
              
              if (newActivityError) throw newActivityError;
            }
          }
        }
      }
      
      setSemesters([...newSemesters, ...semesters]);
      setSelectedSemesters([]);
      
      toast.dismiss(duplicatingToast);
      toast.success(`${newSemesters.length} semestre(s) duplicados con éxito`);
    } catch (error) {
      toast.error('Error duplicando semestres: ' + error.message);
    } finally {
      setIsDuplicating(false);
    }
  }

  const filteredSemesters = semesters.filter(semester => 
    semester.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allFilteredSelected = filteredSemesters.length > 0 && 
    filteredSemesters.every(sem => selectedSemesters.includes(sem.id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedSemesters(prevSelected => 
        prevSelected.filter(id => !filteredSemesters.some(sem => sem.id === id))
      );
    } else {
      const filteredIds = filteredSemesters.map(sem => sem.id);
      setSelectedSemesters(prevSelected => {
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

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  return (
    <Layout>
      <div className="container p-4 mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <h1 className="text-2xl font-bold">Mis Semestres</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSemesterForm(true)}
              className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Crear Semestre
            </button>
            
            {selectedSemesters.length > 0 && (
              <>
                <button
                  onClick={duplicateSelectedSemesters}
                  disabled={isDuplicating}
                  className={`flex items-center px-4 py-2 text-white bg-green-600 rounded-md ${
                    isDuplicating ? 'opacity-75 cursor-not-allowed' : 'hover:bg-green-700'
                  } text-sm whitespace-nowrap`}
                >
                  {isDuplicating ? (
                    <>
                      <svg className="w-4 h-4 mr-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="min-w-[80px] inline-block">Duplicando...</span>
                    </>
                  ) : (
                    <>
                      <FaCopy className="mr-1 flex-shrink-0" /> 
                      <span className="truncate">Duplicar {selectedSemesters.length}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setConfirmMultiDelete(true)}
                  className="flex items-center px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 text-sm whitespace-nowrap"
                >
                  <FaTrash className="mr-1 flex-shrink-0" /> 
                  <span className="truncate">Eliminar {selectedSemesters.length}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 mb-4 bg-white rounded-lg shadow">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0 md:gap-4">
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Buscar semestres..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center">
                <FaSort className="mr-2 text-gray-500" />
                <select 
                  value={sortOrder}
                  onChange={handleSortChange}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="newest">Más recientes primero</option>
                  <option value="oldest">Más antiguos primero</option>
                  <option value="alphabetical">Orden alfabético</option>
                </select>
              </div>
            
              <div className="flex items-center ml-auto sm:ml-0">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={allFilteredSelected && filteredSemesters.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700 whitespace-nowrap">
                  Seleccionar todos
                </label>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">Cargando semestres...</div>
        ) : (
          <>
            {filteredSemesters.length === 0 ? (
              searchTerm ? (
                <div className="p-8 text-center bg-white rounded-lg shadow-md">
                  <p className="text-lg text-gray-600">
                    No se encontraron semestres que coincidan con "{searchTerm}".
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-lg shadow-md">
                  <p className="text-lg text-gray-600">
                    Aún no has creado ningún semestre. ¡Empieza ahora!
                  </p>
                </div>
              )
            ) : (
              <SemesterList 
                semesters={filteredSemesters} 
                onDelete={deleteSemester}
                onUpdate={updateSemester}
                selectedSemesters={selectedSemesters}
                setSelectedSemesters={setSelectedSemesters}
              />
            )}
          </>
        )}

        {showSemesterForm && (
          <SemesterForm 
            onSubmit={addSemester} 
            onCancel={() => setShowSemesterForm(false)} 
          />
        )}

        <ConfirmationModal
          isOpen={confirmMultiDelete}
          onClose={() => setConfirmMultiDelete(false)}
          onConfirm={deleteMultipleSemesters}
          title="Confirmar eliminación múltiple"
          message={`¿Estás seguro de eliminar ${selectedSemesters.length} semestre(s)? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      </div>
    </Layout>
  );
}
