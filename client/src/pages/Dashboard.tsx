import { Users, Calendar, TrendingUp, DollarSign } from 'lucide-react';

function Dashboard() {
  const stats = [
    { label: 'Clients actifs', value: '24', icon: Users, color: 'bg-blue-500' },
    { label: 'Séances ce mois', value: '48', icon: Calendar, color: 'bg-emerald-500' },
    { label: 'Progression', value: '+12%', icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Revenus', value: '2 400 €', icon: DollarSign, color: 'bg-amber-500' },
  ];

  const prochainesSeances = [
    { client: 'Marie Dupont', heure: '09:00', type: 'Musculation' },
    { client: 'Jean Martin', heure: '10:30', type: 'Cardio' },
    { client: 'Sophie Bernard', heure: '14:00', type: 'Yoga' },
    { client: 'Pierre Durand', heure: '16:30', type: 'Musculation' },
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Vue d&apos;ensemble de ton activité</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prochaines séances */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Prochaines séances</h2>
          <div className="space-y-4">
            {prochainesSeances.map((seance, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{seance.client}</p>
                  <p className="text-sm text-gray-600">{seance.type}</p>
                </div>
                <span className="text-emerald-600 font-semibold">{seance.heure}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <button className="w-full p-4 text-left bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
              <p className="font-medium text-emerald-800">+ Nouveau client</p>
              <p className="text-sm text-emerald-600">Ajouter un client à ton portefeuille</p>
            </button>
            <button className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <p className="font-medium text-blue-800">+ Planifier séance</p>
              <p className="text-sm text-blue-600">Créer une nouvelle séance</p>
            </button>
            <button className="w-full p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <p className="font-medium text-purple-800">+ Créer programme</p>
              <p className="text-sm text-purple-600">Nouveau programme d&apos;entraînement</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;