import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function NewSubject() {
  const router = useRouter();
  const { semester_id } = router.query;
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [semesterName, setSemesterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    min_passing_grade: 61,
  });

  useEffect(() => {
    if (semester_id && user) {
      fetchSemesterName();
    }
  }, [semester_id, user]);

  async function fetchSemesterName() {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('name')
        .eq('id', semester_id)
        .single();
      
      if (error) throw error;
      
      setSemesterName(data?.name || '');
    } catch (error) {
      toast.error('Error obteniendo información del semestre');
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'min_passing_grade' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre de la materia es requerido');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subjects')
        .insert([{
          semester_id,
          name: formData.name,
          min_passing_grade: formData.min_passing_grade
        }])
        .select();
      
      if (error) throw error;
      
      toast.success('Materia creada con éxito');
      router.push(`/subject/${data[0].id}`);
    } catch (error) {
      toast.error('Error al crear la materia: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container p-4 mx-auto">
        <div className="flex items-center mb-6">
          <Link href={`/semester/${semester_id}`} className="p-2 mr-3 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Agregar Materia</h1>
            {semesterName && <p className="text-gray-600">Semestre: {semesterName}</p>}
          </div>
        </div>
        
        <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                Nombre de la materia
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Matemáticas I"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="min_passing_grade" className="block mb-2 text-sm font-medium text-gray-700">
                Nota mínima para aprobar
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="min_passing_grade"
                  name="min_passing_grade"
                  min="1"
                  max="100"
                  value={formData.min_passing_grade}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="ml-2">/100</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Define la nota mínima que consideras necesaria para aprobar esta materia
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Link 
                href={`/semester/${semester_id}`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Materia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
