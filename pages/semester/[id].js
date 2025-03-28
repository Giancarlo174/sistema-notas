import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { FaPlus, FaArrowLeft, FaTrash, FaSearch } from 'react-icons/fa';
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

  useEffect(() => {
    if (id && user) {
      fetchSemesterData();
    }
  }, [id, user]);

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
      
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('semester_id', id)
        .order('created_at', { ascending: false });
      
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

  const showDeleteConfirmation = (subject) => {
    setConfirmDelete({
      show: true,
      id: subject.id,
      name: subject.name
    });
  };

  // Filtrar materias según el término de búsqueda
  const filteredSubjects = subjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Comprobar si todas las materias filtradas están seleccionadas
  const allFilteredSelected = filteredSubjects.length > 0 && 
    filteredSubjects.every(subj => selectedSubjects.includes(subj.id));

  // Manejar "seleccionar todos"
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

  // Manejar selección individual
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
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              placeholder="Buscar materias..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <FaSearch className="absolute top-3 left-3 text-gray-400" />
          </div>
          
          <div className="flex space-x-2">
            {selectedSubjects.length > 0 && (
              <button
                onClick={() => setConfirmMultiDelete(true)}
                className="flex items-center px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <FaTrash className="mr-2" /> Eliminar {selectedSubjects.length}
              </button>
            )}
            
            <Link href={`/subject/new?semester_id=${id}`} className="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
              <FaPlus className="mr-2" /> Agregar Materia
            </Link>
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
        
        {/* Modal para eliminar una materia */}
        <ConfirmationModal
          isOpen={confirmDelete.show}
          onClose={() => setConfirmDelete({ show: false, id: null, name: '' })}
          onConfirm={() => handleDeleteSubject(confirmDelete.id)}
          title="Confirmar eliminación"
          message={`¿Estás seguro de eliminar la materia "${confirmDelete.name}"? Se eliminarán todas sus categorías y actividades.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
        />
        
        {/* Modal para eliminación múltiple */}
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
