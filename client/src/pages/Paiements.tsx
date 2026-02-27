import { useState, useMemo } from 'react';
import { Plus, CreditCard, TrendingUp, Users, Calendar } from 'lucide-react';

interface Paiement {
  id: string;
  client: string;
  montant: number;
  date: string;
  statut: 'paye' | 'en_attente' | 'retard';
  type: 'abonnement' | 'seance' | 'programme';
}

function getStatutColor(statut: string) {
  switch (statut) {
    case 'paye':
      return 'bg-emerald-100 text-emerald-700';
    case 'en_attente':
      return 'bg-amber-100 text-amber-700';
    case 'retard':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'abonnement':
      return 'Abonnement';
    case 'seance':
      return 'Séance';
    case 'programme':
      return 'Programme';
    default:
      return type;
  }
}

function Paiements() {
  const [paiements] = useState<Paiement[]>([
    {
      id: '1',
      client: 'Marie Dupont',
      montant: 120,
      date: '2026-02-25',
      statut: 'paye',
      type: 'abonnement',
    },
    {
      id: '2',
      client: 'Jean Martin',
      montant: 45,
      date: '2026-02-24',
      statut: 'paye',
      type: 'seance',
    },
    {
      id: '3',
      client: 'Sophie Bernard',
      montant: 200,
      date: '2026-02-20',
      statut: 'en_attente',
      type: 'programme',
    },
  ]);

  const totalMois = useMemo(
    () => paiements.filter((p) => p.statut === 'paye').reduce((acc, p) => acc + p.montant, 0),
    [paiements]
  );

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Paiements</h1>
          <p className="text-gray-600">Gère tes revenus et factures</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={20} />
          Nouvelle facture
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ce mois</p>
              <p className="text-2xl font-bold text-emerald-600">{totalMois} €</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En attente</p>
              <p className="text-2xl font-bold text-amber-600">200 €</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Calendar className="text-amber-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Clients actifs</p>
              <p className="text-2xl font-bold text-blue-600">24</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taux encaissement</p>
              <p className="text-2xl font-bold text-purple-600">92%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <CreditCard className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-sm font-medium text-gray-600">
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Montant</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-1">Action</div>
        </div>

        {paiements.map((paiement) => (
          <div key={paiement.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="col-span-3">
              <p className="font-medium text-gray-800">{paiement.client}</p>
            </div>
            <div className="col-span-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {getTypeLabel(paiement.type)}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">{paiement.date}</span>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-gray-800">{paiement.montant} €</span>
            </div>
            <div className="col-span-2">
              <span className={`px-2 py-1 rounded-full text-sm ${getStatutColor(paiement.statut)}`}>
                {paiement.statut === 'paye' ? 'Payé' : paiement.statut === 'en_attente' ? 'En attente' : 'Retard'}
              </span>
            </div>
            <div className="col-span-1">
              <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                Voir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Paiements;