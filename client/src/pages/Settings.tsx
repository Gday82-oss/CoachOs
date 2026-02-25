import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';

function Settings() {
  const sections = [
    {
      icon: User,
      title: 'Profil Coach',
      description: 'Gérez vos informations personnelles et professionnelles.',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configurez vos préférences de notifications.',
    },
    {
      icon: Shield,
      title: 'Sécurité',
      description: 'Gérez votre mot de passe et la sécurité du compte.',
    },
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-600">Configurez votre espace coach</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <section.icon size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{section.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{section.description}</p>
              <p className="text-sm text-emerald-600 mt-3 font-medium">Bientôt disponible</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
        <SettingsIcon size={20} className="text-gray-400" />
        <p className="text-gray-500 text-sm">D&apos;autres options de configuration seront ajoutées prochainement.</p>
      </div>
    </div>
  );
}

export default Settings;
