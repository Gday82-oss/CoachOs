import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Phone, Mail, MoreVertical, Loader2 } from 'lucide-react';
import { supabase, type Client } from '../lib/supabase';

function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (client) =>
          `${client.prenom} ${client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      ),
    [clients, searchTerm]
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-600">Gère ton portefeuille clients</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={20} />
          Nouveau client
        </button>
      </header>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Clients list */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-sm font-medium text-gray-600">
          <div className="col-span-3">Client</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-4">Objectifs</div>
          <div className="col-span-2">Actions</div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun client trouvé. Ajoute ton premier client !
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="col-span-3">
                <p className="font-medium text-gray-800">{client.prenom} {client.nom}</p>
              </div>
              <div className="col-span-3">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Mail size={14} />
                    {client.email}
                  </div>
                )}
                {client.telephone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} />
                    {client.telephone}
                  </div>
                )}
              </div>
              <div className="col-span-4">
                <div className="flex flex-wrap gap-2">
                  {client.objectifs?.map((obj, idx) => (
                    <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                      {obj}
                    </span>
                  )) || <span className="text-gray-400 text-sm">Aucun objectif</span>}
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <button className="p-2 hover:bg-gray-200 rounded-lg">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Clients;