import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import {
  Phone, MapPin, Calendar, Target,
  ChevronRight, Bell, Shield, HelpCircle, LogOut,
  Edit3, Camera
} from 'lucide-react';

interface ClientProfileProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    date_naissance?: string;
    objectif?: string;
    coach_id?: string;
  };
}

const menuItems = [
  { icone: Bell, label: 'Notifications', valeur: 'Activées' },
  { icone: Shield, label: 'Confidentialité', valeur: '' },
  { icone: HelpCircle, label: 'Aide & Support', valeur: '' },
];

export default function ClientProfile({ client }: ClientProfileProps) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const objectifs = [
    'Perte de poids',
    'Prise de masse',
    'Maintien forme',
    'Performance',
    'Rééducation'
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 pt-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mon profil</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 rounded-xl bg-white shadow-sm text-gray-600"
        >
          <Edit3 size={20} />
        </motion.button>
      </div>

      {/* Photo & nom */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00C896] to-[#00E5FF] flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-[#00C896]/20">
            {client.prenom[0]}{client.nom[0]}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600"
          >
            <Camera size={16} />
          </motion.button>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mt-4">
          {client.prenom} {client.nom}
        </h2>
        <p className="text-gray-500">{client.email}</p>
      </div>

      {/* Infos principales */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Phone className="text-blue-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Téléphone</p>
              <p className="font-medium text-gray-800">{client.telephone || 'Non renseigné'}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <MapPin className="text-green-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Adresse</p>
              <p className="font-medium text-gray-800">{client.adresse || 'Non renseignée'}</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Calendar className="text-purple-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Date de naissance</p>
              <p className="font-medium text-gray-800">
                {client.date_naissance 
                  ? new Date(client.date_naissance).toLocaleDateString('fr-FR')
                  : 'Non renseignée'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Objectif */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Mon objectif</h3>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
              <Target className="text-[#00C896]" size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{client.objectif || 'Maintien forme'}</p>
              <p className="text-xs text-gray-500">Depuis 3 mois</p>
            </div>
          </div>
          
          {isEditing && (
            <div className="flex flex-wrap gap-2 mt-3">
              {objectifs.map((obj) => (
                <button
                  key={obj}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    (client.objectif || 'Maintien forme') === obj
                      ? 'bg-[#00C896] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {obj}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {menuItems.map((item, idx) => (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 p-4 ${
              idx !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <item.icone className="text-gray-500" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">{item.label}</p>
              {item.valeur && (
                <p className="text-xs text-[#00C896]">{item.valeur}</p>
              )}
            </div>
            <ChevronRight className="text-gray-400" size={20} />
          </motion.button>
        ))}
      </div>

      {/* Version */}
      <p className="text-center text-xs text-gray-400">
        MyCareCoach v1.0.0
      </p>

      {/* Déconnexion */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-500 rounded-2xl font-medium"
      >
        <LogOut size={20} />
        Se déconnecter
      </motion.button>
    </motion.div>
  );
}
