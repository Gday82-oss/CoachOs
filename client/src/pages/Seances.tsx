import { useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Seance {
  id: string;
  client: string;
  date: string;
  heure: string;
  duree: number;
  type: string;
  statut: 'planifiee' | 'terminee' | 'annulee';
}

function getStatutColor(statut: string) {
  switch (statut) {
    case 'planifiee':
      return 'bg-blue-100 text-blue-700';
    case 'terminee':
      return 'bg-emerald-100 text-emerald-700';
    case 'annulee':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function Seances() {
  const [seances] = useState<Seance[]>([
    {
      id: '1',
      client: 'Marie Dupont',
      date: '2026-02-26',
      heure: '09:00',
      duree: 60,
      type: 'Musculation',
      statut: 'planifiee',
    },
    {
      id: '2',
      client: 'Jean Martin',
      date: '2026-02-26',
      heure: '10:30',
      duree: 45,
      type: 'Cardio',
      statut: 'planifiee',
    },
    {
      id: '3',
      client: 'Sophie Bernard',
      date: '2026-02-25',
      heure: '14:00',
      duree: 60,
      type: 'Yoga',
      statut: 'terminee',
    },
  ]);

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Séances</h1>
          <p className="text-gray-600">Planifie et gère les séances</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={20} />
          Nouvelle séance
        </button>
      </header>

      {/* Calendrier simplifié */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Calendar className="text-emerald-600" size={24} />
          <h2 className="text-lg font-semibold">Aujourd'hui - 26 Février 2026</h2>
        </div>
      </div>

      {/* Liste des séances */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-sm font-medium text-gray-600">
          <div className="col-span-2">Heure</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Durée</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-1">Actions</div>
        </div>

        {seances.map((seance) => (
          <div key={seance.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="col-span-2 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span className="font-medium">{seance.heure}</span>
            </div>
            <div className="col-span-3">
              <p className="font-medium text-gray-800">{seance.client}</p>
            </div>
            <div className="col-span-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {seance.type}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">{seance.duree} min</span>
            </div>
            <div className="col-span-2">
              <span className={`px-2 py-1 rounded-full text-sm ${getStatutColor(seance.statut)}`}>
                {seance.statut}
              </span>
            </div>
            <div className="col-span-1 flex gap-2">
              <button className="p-1 hover:bg-emerald-100 rounded text-emerald-600">
                <CheckCircle size={18} />
              </button>
              <button className="p-1 hover:bg-red-100 rounded text-red-600">
                <XCircle size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Seances;