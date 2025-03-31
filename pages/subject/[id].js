import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { FaArrowLeft, FaEdit, FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import CategoryList from '../../components/CategoryList';
import CategoryForm from '../../components/CategoryForm';
import { calculateSubjectGrade, getStatusClass } from '../../utils/gradeUtils';
import useUIState from '../../hooks/useUIState';

export default function SubjectPage() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [subject, setSubject] = useState(null);
  const [semester, setSemester] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activities, setActivities] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useUIState(`show_category_form_${id}`, false);
  const [editingSubject, setEditingSubject] = useUIState(`editing_subject_${id}`, false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    min_passing_grade: 61,
  });

  useEffect(() => {
    if (id && user) {
      fetchData();
    }
  }, [id, user]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch subject
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*, semesters(*)')
        .eq('id', id)
        .single();
      
      if (subjectError) throw subjectError;
      
      setSubject(subjectData);
      setSemester(subjectData.semesters);
      setSubjectForm({
        name: subjectData.name,
        min_passing_grade: subjectData.min_passing_grade,
      });
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('subject_id', id)
        .order('created_at', { ascending: true });
      
      if (categoriesError) throw categoriesError;
      
      setCategories(categoriesData || []);
      
      // Fetch activities for all categories
      if (categoriesData && categoriesData.length > 0) {
        const categoryIds = categoriesData.map(cat => cat.id);
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .in('category_id', categoryIds)
          .order('created_at', { ascending: true });
        
        if (activitiesError) throw activitiesError;
        
        // Group activities by category
        const activitiesByCategory = {};
        (activitiesData || []).forEach(activity => {
          if (!activitiesByCategory[activity.category_id]) {
            activitiesByCategory[activity.category_id] = [];
          }
          activitiesByCategory[activity.category_id].push(activity);
        });
        
        setActivities(activitiesByCategory);
      }
    } catch (error) {
      toast.error('Error cargando datos: ' + error.message);
      if (error.code === 'PGRST116') {
        // No se encontró la materia
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleAddCategory = async (categoryData) => {
    try {
      const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);
      const newTotal = totalPercentage + categoryData.percentage;
      
      if (newTotal > 100) {
        toast.error(`El total de porcentajes (${newTotal}%) excede el 100%. Ajusta el porcentaje.`);
        return false;
      }
      
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          subject_id: id,
          name: categoryData.name,
          percentage: categoryData.percentage,
          calculation_mode: categoryData.calculation_mode,
          total_activities: categoryData.total_activities
        }])
        .select();
      
      if (error) throw error;
      
      setCategories([...categories, data[0]]);
      setShowCategoryForm(false);
      toast.success('Categoría agregada con éxito');
      return true;
    } catch (error) {
      toast.error('Error agregando categoría: ' + error.message);
      return false;
    }
  };

  const handleUpdateCategory = async (categoryId, categoryData) => {
    try {
      // Calculate total percentages excluding the current category
      const otherCategories = categories.filter(cat => cat.id !== categoryId);
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.percentage, 0);
      const newTotal = otherTotal + categoryData.percentage;
      
      if (newTotal > 100) {
        toast.error(`El total de porcentajes (${newTotal}%) excede el 100%. Ajusta el porcentaje.`);
        return false;
      }
      
      const { error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          percentage: categoryData.percentage,
          calculation_mode: categoryData.calculation_mode,
          total_activities: categoryData.total_activities
        })
        .eq('id', categoryId);
      
      if (error) throw error;
      
      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, ...categoryData } : cat
      ));
      
      toast.success('Categoría actualizada con éxito');
      return true;
    } catch (error) {
      toast.error('Error actualizando categoría: ' + error.message);
      return false;
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
      
      // Delete from local state
      setCategories(categories.filter(cat => cat.id !== categoryId));
      // Remove activities of this category
      const newActivities = { ...activities };
      delete newActivities[categoryId];
      setActivities(newActivities);
      
      toast.success('Categoría eliminada con éxito');
    } catch (error) {
      toast.error('Error eliminando categoría: ' + error.message);
    }
  };

  const handleAddActivity = async (categoryId, activityData) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          category_id: categoryId,
          name: activityData.name,
          max_score: activityData.max_score,
          obtained_score: activityData.obtained_score,
          is_pending: activityData.is_pending
        }])
        .select();
      
      if (error) throw error;
      
      // Update local state
      const newActivity = data[0];
      setActivities({
        ...activities,
        [categoryId]: [...(activities[categoryId] || []), newActivity]
      });
      
      toast.success('Actividad agregada con éxito');
      return true;
    } catch (error) {
      toast.error('Error agregando actividad: ' + error.message);
      return false;
    }
  };

  const handleUpdateActivity = async (activityId, categoryId, activityData) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({
          name: activityData.name,
          max_score: activityData.max_score,
          obtained_score: activityData.obtained_score,
          is_pending: activityData.is_pending
        })
        .eq('id', activityId);
      
      if (error) throw error;
      
      // Update local state
      setActivities({
        ...activities,
        [categoryId]: activities[categoryId].map(act => 
          act.id === activityId ? { ...act, ...activityData } : act
        )
      });
      
      toast.success('Actividad actualizada con éxito');
      return true;
    } catch (error) {
      toast.error('Error actualizando actividad: ' + error.message);
      return false;
    }
  };

  const handleDeleteActivity = async (activityId, categoryId) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);
      
      if (error) throw error;
      
      // Update local state
      setActivities({
        ...activities,
        [categoryId]: activities[categoryId].filter(act => act.id !== activityId)
      });
      
      toast.success('Actividad eliminada con éxito');
    } catch (error) {
      toast.error('Error eliminando actividad: ' + error.message);
    }
  };

  const handleSubjectFormChange = (e) => {
    const { name, value } = e.target;
    setSubjectForm({
      ...subjectForm,
      [name]: name === 'min_passing_grade' ? parseFloat(value) : value,
    });
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    
    if (!subjectForm.name.trim()) {
      toast.error('El nombre de la materia es requerido');
      return;
    }

    try {
      const { error } = await supabase
        .from('subjects')
        .update({
          name: subjectForm.name,
          min_passing_grade: subjectForm.min_passing_grade
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setSubject({
        ...subject,
        name: subjectForm.name,
        min_passing_grade: subjectForm.min_passing_grade
      });
      
      setEditingSubject(false);
      toast.success('Materia actualizada con éxito');
    } catch (error) {
      toast.error('Error actualizando materia: ' + error.message);
    }
  };

  // Modificar la función deleteMultipleCategories
  async function deleteMultipleCategories(categoryIds) {
    try {
      // Guarda una copia de las IDs seleccionadas antes de resetear la selección
      const categoriesToDelete = [...categoryIds];
      
      // Actualiza primero el estado local para una respuesta UI inmediata
      setCategories(currentCategories => 
        currentCategories.filter(cat => !categoriesToDelete.includes(cat.id))
      );
      
      // También actualiza el estado de actividades
      const updatedActivities = { ...activities };
      categoriesToDelete.forEach(catId => {
        delete updatedActivities[catId];
      });
      setActivities(updatedActivities);
      
      // Luego ejecuta la operación en la base de datos
      for (const categoryId of categoriesToDelete) {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);
        
        if (error) throw error;
      }
      
      toast.success('Categorías eliminadas con éxito');
    } catch (error) {
      // Si hay error, vuelve a cargar los datos para asegurar consistencia
      toast.error('Error eliminando categorías: ' + error.message);
      fetchData();
    }
  }

  // Calculate the subject grade
  const gradeInfo = calculateSubjectGrade(categories, activities);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          Cargando...
        </div>
      </Layout>
    );
  }

  if (!subject) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="mb-4 text-lg text-red-600">Materia no encontrada</p>
          <Link href="/" className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Volver al inicio
          </Link>
        </div>
      </Layout>
    );
  }

  // Check if all categories add up to 100%
  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);
  const isComplete = totalPercentage === 100;

  return (
    <Layout title={subject ? `${subject.name} | Sistema Académico` : 'Detalles de Materia'}>
      <div className="container p-4 mx-auto">
        <div className="flex items-center mb-6">
          <Link href={`/semester/${subject.semester_id}`} className="p-2 mr-3 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
            <FaArrowLeft />
          </Link>
          <div className="flex-1">
            {editingSubject ? (
              <form onSubmit={handleUpdateSubject} className="space-y-3">
                <div>
                  <input
                    type="text"
                    name="name"
                    value={subjectForm.name}
                    onChange={handleSubjectFormChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <label className="mr-2 text-sm">Nota mínima para aprobar:</label>
                  <input
                    type="number"
                    name="min_passing_grade"
                    min="1"
                    max="100"
                    value={subjectForm.min_passing_grade}
                    onChange={handleSubjectFormChange}
                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                  />
                  <span className="ml-1">/100</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSubject(false)}
                    className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold">{subject.name}</h1>
                  <button
                    onClick={() => setEditingSubject(true)}
                    className="p-1 ml-2 text-gray-500 hover:text-indigo-600"
                  >
                    <FaEdit />
                  </button>
                </div>
                <p className="text-gray-600">
                  Semestre: {semester?.name} &bull; Nota mínima: {subject.min_passing_grade}/100
                </p>
              </>
            )}
          </div>
          
          <div className="p-4 ml-auto text-center bg-white rounded-lg shadow-sm">
            <div className="mb-1 text-xl font-bold">Nota Actual</div>
            <div className="flex items-baseline justify-center">
              <span className="text-3xl font-bold">{gradeInfo.grade}</span>
              <span className="ml-1 text-gray-500">/100</span>
            </div>
            <div className={`font-bold ${getStatusClass(gradeInfo.letter)}`}>
              {gradeInfo.letter} - {gradeInfo.status}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {gradeInfo.percentComplete}% del curso evaluado
            </div>
          </div>
        </div>
        
        {!isComplete && (
          <div className="p-4 mb-4 text-amber-800 bg-amber-100 rounded-md">
            <p className="font-semibold">
              El sistema de evaluación está incompleto. Total: {totalPercentage}%
            </p>
            <p>
              Debes definir categorías que sumen exactamente 100% para un cálculo correcto.
            </p>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Sistema de Evaluación</h2>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="flex items-center px-3 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <FaPlus className="mr-1" /> Agregar Categoría
            </button>
          </div>
          
          {categories.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-lg shadow">
              <p className="text-gray-600">
                Aún no has definido categorías de evaluación para esta materia.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Crea categorías como "Parciales", "Laboratorios", etc. con sus respectivos porcentajes.
              </p>
            </div>
          ) : (
            <CategoryList
              categories={categories}
              activities={activities}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddActivity={handleAddActivity}
              onUpdateActivity={handleUpdateActivity}
              onDeleteActivity={handleDeleteActivity}
              onDeleteMultipleCategories={deleteMultipleCategories} // Añade esta prop
            />
          )}
        </div>
        
        {showCategoryForm && (
          <CategoryForm
            onSubmit={handleAddCategory}
            onCancel={() => setShowCategoryForm(false)}
            currentTotal={totalPercentage}
          />
        )}
      </div>
    </Layout>
  );
}
