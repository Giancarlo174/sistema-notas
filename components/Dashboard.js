import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-toastify';
import SemesterList from './SemesterList';
import SemesterForm from './SemesterForm';
import Layout from './Layout';
import ConfirmationModal from './ConfirmationModal';
import { FaTrash } from 'react-icons/fa';

export default function Dashboard() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [confirmMultiDelete, setConfirmMultiDelete] = useState(false);

  useEffect(() => {
    if (user) fetchSemesters();
  }, [user]);

  async function fetchSemesters() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSemesters(data || []);
    } catch (error) {
      toast.error('Error cargando semestres: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <Layout>
      <div className="container p-4 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mis Semestres</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSemesterForm(true)}
              className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Crear Semestre
            </button>
            
            {selectedSemesters.length > 0 && (
              <button
                onClick={() => setConfirmMultiDelete(true)}
                className="flex items-center px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <FaTrash className="mr-2" /> Eliminar {selectedSemesters.length} semestre(s)
              </button>
            )}
          </div>
        </div>

        <div className="p-4 mb-4 bg-white rounded-lg shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-1/2 mb-4 md:mb-0">
              <input
                type="text"
                placeholder="Buscar semestres..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="selectAll"
                checked={allFilteredSelected && filteredSemesters.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                Seleccionar todos
              </label>
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
