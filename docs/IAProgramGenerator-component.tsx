import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Loader2, Check, AlertCircle } from 'lucide-react';

interface GenerationForm {
  clientId: string;
  objectif: string;
  niveau: string;
  duree_semaines: number;
  frequence_semaine: number;
  equipement: string[];
  contraintes: string;
}

export function IAProgramGenerator() {
  const [form, setForm] = useState<GenerationForm>({
    clientId: '',
    objectif: 'perte_poids',
    niveau: 'intermediaire',
    duree_semaines: 4,
    frequence_semaine: 3,
    equipement: ['haltères', 'tapis'],
    contraintes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ia/generate-programme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      if (!response.ok) throw new Error('Erreur génération');
      
      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError('La génération a échoué. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Wand2 className="text-purple-500" />
          Générateur IA de Programmes
        </h1>
        <p className="text-gray-600 mt-2">
          Créez un programme personnalisé en 30 secondes avec l'IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">Paramètres du programme</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objectif principal
              </label>
              <select
                value={form.objectif}
                onChange={(e) => setForm({ ...form, objectif: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-purple-500"
              >
                <option value="perte_poids">Perte de poids</option>
                <option value="prise_masse">Prise de masse</option>
                <option value="tonification">Tonification</option>
                <option value="endurance">Endurance</option>
                <option value="force">Force</option>
                <option value="sante">Santé / Bien-être</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau
                </label>
                <select
                  value={form.niveau}
                  onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                  className="w-full rounded-lg border-gray-300"
                >
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="avance">Avancé</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (semaines)
                </label>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={form.duree_semaines}
                  onChange={(e) => setForm({ ...form, duree_semaines: parseInt(e.target.value) })}
                  className="w-full rounded-lg border-gray-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fréquence: {form.frequence_semaine} séances/semaine
              </label>
              <input
                type="range"
                min={2}
                max={6}
                value={form.frequence_semaine}
                onChange={(e) => setForm({ ...form, frequence_semaine: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Équipement disponible
              </label>
              <div className="flex flex-wrap gap-2">
                {['haltères', 'kettlebell', 'tapis', 'barre', 'banc', 'élastiques', 'aucun'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      const newEquip = form.equipement.includes(item)
                        ? form.equipement.filter((e) => e !== item)
                        : [...form.equipement, item];
                      setForm({ ...form, equipement: newEquip });
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      form.equipement.includes(item)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraintes / Blessures (optionnel)
              </label>
              <textarea
                value={form.contraintes}
                onChange={(e) => setForm({ ...form, contraintes: e.target.value })}
                placeholder="Ex: Genou droit fragile, problème de dos..."
                className="w-full rounded-lg border-gray-300"
                rows={3}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || form.equipement.length === 0}
              className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Générer le programme
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence mode="wait">
          {preview && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6"
            >
              <div className="flex items-center gap-2 text-purple-700 mb-4">
                <Check className="text-green-500" />
                <span className="font-medium">Programme généré !</span>
              </div>

              <h3 className="text-xl font-bold mb-2">{preview.nom}</h3>
              <p className="text-gray-600 mb-4">{preview.objectif}</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Durée</span>
                  <span className="font-medium">{preview.duree_semaines} semaines</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Séances</span>
                  <span className="font-medium">{preview.semaines?.[0]?.seances?.length || 0}/semaine</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-purple-500 text-white py-2 rounded-lg font-medium hover:bg-purple-600">
                  Appliquer au client
                </button>
                <button 
                  onClick={() => setPreview(null)}
                  className="flex-1 bg-white text-gray-700 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50"
                >
                  Modifier
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
