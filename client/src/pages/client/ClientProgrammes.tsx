import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClientProgrammesProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
  };
}

interface Programme {
  id: string;
  titre: string;
  contenu: string;
  duree_semaines: number;
  date_debut: string;
  date_fin: string;
  statut: string;
}

export default function ClientProgrammes({ client }: ClientProgrammesProps) {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgrammes();
  }, [client.id]);

  async function fetchProgrammes() {
    try {
      const { data } = await supabase
        .from('programmes')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      setProgrammes(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-700';
      case 'termine': return 'bg-blue-100 text-blue-700';
      case 'brouillon': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mes programmes</h1>
        <p className="text-gray-600 mt-2">Vos programmes d'entraînement personnalisés</p>
      </div>

      {programmes.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun programme</h3>
          <p className="text-gray-500">Votre coach n'a pas encore créé de programme pour vous.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {programmes.map((prog, idx) => (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedProgramme(prog)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <FileText className="text-white" size={28} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{prog.titre}</h3>                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatutColor(prog.statut)}`}>
                        {prog.statut}
                      </span>
                      <span className="text-sm text-gray-500">{prog.duree_semaines} semaines</span>
                    </div>                  </div>
                </div>
                
                <ChevronRight className="text-gray-400" />
              </div>

              {prog.date_debut && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    Début: {new Date(prog.date_debut).toLocaleDateString('fr-FR')}
                  </span>
                  {prog.date_fin && (
                    <span>Fin: {new Date(prog.date_fin).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal détail */}
      {selectedProgramme && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedProgramme.titre}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-3 py-1 rounded-full ${getStatutColor(selectedProgramme.statut)}`}>
                    {selectedProgramme.statut}
                  </span>
                  <span className="text-sm text-gray-500">{selectedProgramme.duree_semaines} semaines</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProgramme(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-xl">
                {selectedProgramme.contenu}
              </pre>
            </div>

            <button 
              onClick={() => setSelectedProgramme(null)}
              className="w-full mt-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
            >
              Fermer
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
