import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Bot, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Client {
  id: string;
  prenom: string;
  nom: string;
}

interface Usage {
  messages_count: number;
  limit: number;
  remaining: number;
}

interface ChatbotIAProps {
  onClose: () => void;
}

const SUGGESTIONS = [
  'Créer un programme débutant',
  'Programme perte de poids',
  'Récupération après blessure',
  'Recommandations OMS',
];

const API_URL = import.meta.env.VITE_API_URL;

export default function ChatbotIA({ onClose }: ChatbotIAProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [usage, setUsage] = useState<Usage | null>(null);
  const [quotaAtteint, setQuotaAtteint] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les clients du coach
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('clients')
        .select('id, prenom, nom')
        .eq('coach_id', user.id)
        .order('prenom');
      if (data) setClients(data);
    });
  }, []);

  // Charger l'usage du mois
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const mois = new Date().toISOString().slice(0, 7);
      const { data } = await supabase
        .from('chat_usage')
        .select('messages_count')
        .eq('coach_id', user.id)
        .eq('mois', mois)
        .maybeSingle();
      const count = data?.messages_count ?? 0;
      setUsage({ messages_count: count, limit: 100, remaining: 100 - count });
      if (count >= 100) setQuotaAtteint(true);
    });
  }, []);

  // Message de bienvenue une fois l'usage chargé
  useEffect(() => {
    if (usage !== null && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Bonjour ! Je suis votre assistant IA spécialisé en coaching santé-sport.\nVous avez **${usage.remaining} message${usage.remaining !== 1 ? 's' : ''}** disponible${usage.remaining !== 1 ? 's' : ''} ce mois-ci.\nComment puis-je vous aider ?`,
      }]);
    }
  }, [usage]);

  // Scroll vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || quotaAtteint) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // On envoie seulement les messages user/assistant (pas le message de bienvenue)
      const apiMessages = newMessages
        .filter(m => m.role === 'user' || (m.role === 'assistant' && messages.indexOf(m) !== 0))
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_URL}/chat-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          clientId: selectedClientId || undefined,
        }),
      });

      const data = await response.json();

      if (response.status === 429 || data.error === 'QUOTA_ATTEINT') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Vous avez atteint votre limite de 100 messages pour ce mois.\nRevenez le 1er du mois prochain !',
        }]);
        setQuotaAtteint(true);
        return;
      }

      if (!response.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Une erreur est survenue. Veuillez réessayer.',
        }]);
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.usage) setUsage(data.usage);

    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Couleur du compteur selon le nombre de messages
  const counterColor = () => {
    if (!usage) return 'text-gray-400';
    if (usage.messages_count > 90) return 'text-red-400';
    if (usage.messages_count > 70) return 'text-orange-400';
    return 'text-green-400';
  };

  // Rendu d'un message avec support **gras**
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 bottom-0 z-50 flex flex-col shadow-2xl"
      style={{
        width: 'min(400px, 100vw)',
        background: '#F8FAFC',
        borderLeft: '1px solid #E2E8F0',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: '#1A2B4A' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00C896] flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">MyCareCoach AI</p>
            {usage && (
              <p className={`text-xs font-medium ${counterColor()}`}>
                {usage.messages_count} / {usage.limit} messages ce mois
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Sélecteur de client */}
      <div className="px-3 pt-3 flex-shrink-0">
        <div className="relative">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/20"
          >
            <option value="">Aucun client sélectionné</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.prenom} {c.nom}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {/* Suggestions rapides (visibles seulement au début) */}
        {messages.length <= 1 && !quotaAtteint && (
          <div className="flex flex-wrap gap-2 pb-1">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#1A2B4A]/20 text-[#1A2B4A] bg-white hover:bg-[#1A2B4A] hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={{
                background: msg.role === 'user' ? '#00C896' : '#1A2B4A',
                color: 'white',
                borderRadius: msg.role === 'user'
                  ? '18px 18px 4px 18px'
                  : '18px 18px 18px 4px',
              }}
            >
              {renderText(msg.content)}
            </div>
          </div>
        ))}

        {/* Indicateur "En train de répondre..." */}
        {loading && (
          <div className="flex justify-start">
            <div
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
              style={{ background: '#1A2B4A', borderRadius: '18px 18px 18px 4px' }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/60"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-4 pt-2 flex-shrink-0 border-t border-gray-200 bg-white">
        {quotaAtteint ? (
          <div className="text-center text-sm text-red-500 py-2 font-medium">
            Limite mensuelle atteinte. Revenez le 1er du mois.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Votre question..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A2B4A]/20 bg-gray-50 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
              style={{ background: '#1A2B4A' }}
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}
