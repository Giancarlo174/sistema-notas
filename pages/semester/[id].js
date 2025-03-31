import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { FaPlus, FaArrowLeft, FaTrash, FaSearch, FaSort, FaCopy } from 'react-icons/fa';
import Link from 'next/link';
import { calculateSubjectGrade, getStatusClass } from '../../utils/gradeUtils';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function SemesterPage() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [semester, setSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectGrades, setSubjectGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '' });

  // Estados para búsqueda y selección múltiple
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [confirmMultiDelete, setConfirmMultiDelete] = useState(false);

  // Nuevo estado para controlar el ordenamiento de materias
  const [sortOrder, setSortOrder] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedOrder = localStorage.getItem('subject_sort_order');
      return savedOrder || 'newest';
    }
    return 'newest';
  });

  // Estado para duplicación de materias
  const [isDuplicatingSubjects, setIsDuplicatingSubjects] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('subject_sort_order', sortOrder);
    }
  }, [sortOrder]);

  useEffect(() => {
    if (id && user) {
      fetchSemesterData();
    }
  }, [id, user, sortOrder]);

  async function fetchSemesterData() {
    try {
      setLoading(true);
      
      const { data: semesterData, error: semesterError } = await supabase
        .from('semesters')
        .select('*')
        .eq('id', id)
        .single();
      
      if (semesterError) throw semesterError;
      
      setSemester(semesterData);
      
      let query = supabase
        .from('subjects')
        .select('*')
        .eq('semester_id', id);
      
      if (sortOrder === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortOrder === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortOrder === 'alphabetical') {
        query = query.order('name', { ascending: true });
      } else if (sortOrder === 'grade_desc') {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data: subjectsData, error: subjectsError } = await query;
      
      if (subjectsError) throw subjectsError;
      
      setSubjects(subjectsData || []);
      
      if (subjectsData && subjectsData.length > 0) {
        const gradesInfo = {};
        
        for (const subject of subjectsData) {
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('*')
            .eq('subject_id', subject.id);
          
          if (categoriesError) throw categoriesError;
          
          if (!categoriesData || categoriesData.length === 0) {
            gradesInfo[subject.id] = {
              grade: 0,
              letter: 'N/A',
              status: 'Sin calificar',
              percentComplete: 0
            };
            continue;
          }
          
          const categoryIds = categoriesData.map(cat => cat.id);
          const { data: activitiesData, error: activitiesError } = await supabase
            .from('activities')
            .select('*')
            .in('category_id', categoryIds);
          
          if (activitiesError) throw activitiesError;
          
          const activitiesByCategory = {};
          (activitiesData || []).forEach(activity => {
            if (!activitiesByCategory[activity.category_id]) {
              activitiesByCategory[activity.category_id] = [];
            }
            activitiesByCategory[activity.category_id].push(activity);
          });
          
          gradesInfo[subject.id] = calculateSubjectGrade(categoriesData, activitiesByCategory);
        }
        
        setSubjectGrades(gradesInfo);
      }
    } catch (error) {
      toast.error('Error cargando datos: ' + error.message);
      if (error.code === 'PGRST116') {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSubject(subjectId) {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);
      
      if (error) throw error;
      
      setSubjects(subjects.filter(subject => subject.id !== subjectId));
      toast.success('Materia eliminada con éxito');
    } catch (error) {
      toast.error('Error eliminando materia: ' + error.message);
    }
  }

  async function deleteMultipleSubjects() {
    try {
      for (const subjectId of selectedSubjects) {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('id', subjectId);
        
        if (error) throw error;
      }
      
      setSubjects(subjects.filter(subj => !selectedSubjects.includes(subj.id)));
      setSelectedSubjects([]);
      toast.success('Materias eliminadas con éxito');
    } catch (error) {
      toast.error('Error eliminando materias: ' + error.message);
    } finally {
      setConfirmMultiDelete(false);
    }
  }

  async function duplicateMultipleSubjects() {
    try {
      setIsDuplicatingSubjects(true);
      
      const selectedSubjectsData = subjects.filter(subj => selectedSubjects.includes(subj.id));
      const newSubjects = [];
      
      const duplicatingToast = toast.info(
        `Duplicando ${selectedSubjectsData.length} materia(s)... Por favor espera.`,
        { autoClose: false }
      );
      
      for (const subject of selectedSubjectsData) {
        const { data: newSubjectData, error: subjectError } = await supabase
          .from('subjects')
          .insert([{
            semester_id: id,
            name: `${subject.name} (copia)`,
            min_passing_grade: subject.min_passing_grade
          }])
          .select();
        
        if (subjectError) throw subjectError;
        const newSubject = newSubjectData[0];
        newSubjects.push(newSubject);
        
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
      
      setSubjects([...newSubjects, ...subjects]);
      setSelectedSubjects([]);
      
      toast.dismiss(duplicatingToast);
      toast.success(`${newSubjects.length} materia(s) duplicadas con éxito`);
      
      fetchSemesterData();
      
    } catch (error) {
      toast.error('Error duplicando materias: ' + error.message);
    } finally {
      setIsDuplicatingSubjects(false);
    }
  }

  const showDeleteConfirmation = (subject) => {
    setConfirmDelete({
      show: true,
      id: subject.id,
      name: subject.name
    });
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const filteredSubjects = subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allFilteredSelected = filteredSubjects.length > 0 && 
    filteredSubjects.every(subj => selectedSubjects.includes(subj.id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedSubjects(prevSelected => 
        prevSelected.filter(id => !filteredSubjects.some(subj => subj.id === id))
      );
    } else {
      const filteredIds = filteredSubjects.map(subj => subj.id);
      setSelectedSubjects(prevSelected => {
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

  const handleSelectSubject = (subjectId) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          Cargando...
        </div>
      </Layout>
    );
  }

  if (!semester) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="mb-4 text-lg text-red-600">Semestre no encontrado</p>
          <Link href="/" className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Volver al inicio
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container p-4 mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/" className="p-2 mr-3 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Semestre: {semester.name}</h1>
          
          <div className="ml-auto">
            <Link 
              href={`/subject/new?semester_id=${id}`} 
              className="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <FaPlus className="mr-2" /> Crear Materia
            </Link>
          </div>
        </div>
        
        <div className="p-4 mb-4 bg-white rounded-lg shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Buscar materias..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center">
                <FaSort className="mr-2 text-gray-500" />
                <select 
                  value={sortOrder}
                  onChange={handleSortChange}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="newest">Más recientes primero</option>
                  <option value="oldest">Más antiguas primero</option>
                  <option value="alphabetical">Orden alfabético</option>
                  <option value="grade_desc">Mejor calificación</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="selectAllSubjects"
                  checked={allFilteredSelected && filteredSubjects.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="selectAllSubjects" className="ml-2 text-sm text-gray-700">
                  Seleccionar todos
                </label>
              </div>
              
              {selectedSubjects.length > 0 && (
                <>
                  <button
                    onClick={duplicateMultipleSubjects}
                    disabled={isDuplicatingSubjects}
                    className={`flex items-center px-3 py-1 text-white bg-green-600 rounded-md ${
                      isDuplicatingSubjects ? 'opacity-75 cursor-not-allowed' : 'hover:bg-green-700'
                    }`}
                  >
                    {isDuplicatingSubjects ? (
                      <>
                        <svg className="w-4 h-4 mr-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Duplicando...
                      </>
                    ) : (
                      <>
                        <FaCopy className="mr-1" /> Duplicar {selectedSubjects.length}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmMultiDelete(true)}
                    className="flex items-center px-3 py-1 text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    <FaTrash className="mr-1" /> Eliminar {selectedSubjects.length}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {filteredSubjects.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg shadow-md">
            <p className="text-lg text-gray-600">
              {searchTerm 
                ? `No se encontraron materias que coincidan con "${searchTerm}".` 
                : "Aún no has agregado materias a este semestre."
              }
            </p>
            {!searchTerm && (
              <Link 
                href={`/subject/new?semester_id=${id}`} 
                className="inline-block px-4 py-2 mt-4 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <FaPlus className="inline mr-2" /> Agregar primera materia
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-2">Materia</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Nota Actual
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Letra
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubjects.map((subject) => {
                  const gradeInfo = subjectGrades[subject.id] || {
                    grade: 0,
                    letter: 'N/A',
                    status: 'Sin calificar',
                    percentComplete: 0
                  };
                  const statusClass = getStatusClass(gradeInfo.letter);
                  const isSelected = selectedSubjects.includes(subject.id);
                  
                  return (
                    <tr key={subject.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectSubject(subject.id)}
                            className="w-4 h-4 mr-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{subject.name}</div>
                            {gradeInfo.percentComplete > 0 && (
                              <div className="text-xs text-gray-500">
                                {gradeInfo.percentComplete}% evaluado
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {gradeInfo.grade === 0 && gradeInfo.letter === 'N/A' ? 
                            '--' : gradeInfo.grade.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`${statusClass} font-medium`}>
                          {gradeInfo.letter}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={statusClass}>
                          {gradeInfo.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-3">
                          <Link href={`/subject/${subject.id}`} className="text-indigo-600 hover:text-indigo-900">
                            Ver Detalles
                          </Link>
                          <button
                            onClick={() => showDeleteConfirmation(subject)}
                            className="text-red-500 hover:text-red-700"
                            title="Eliminar materia"
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
        )}
        
        <ConfirmationModal
          isOpen={confirmDelete.show}
          onClose={() => setConfirmDelete({ show: false, id: null, name: '' })}
          onConfirm={() => handleDeleteSubject(confirmDelete.id)}
          title="Confirmar eliminación"
          message={`¿Estás seguro de eliminar la materia "${confirmDelete.name}"? Se eliminarán todas sus categorías y actividades.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
        
        <ConfirmationModal
          isOpen={confirmMultiDelete}
          onClose={() => setConfirmMultiDelete(false)}
          onConfirm={deleteMultipleSubjects}
          title="Confirmar eliminación múltiple"
          message={`¿Estás seguro de eliminar ${selectedSubjects.length} materia(s)? Esta acción eliminará también todas las categorías y actividades asociadas.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
      </div>
    </Layout>
  );
}
