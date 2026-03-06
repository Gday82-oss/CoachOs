import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, Camera, Save, Check,
  Mail, Phone, Briefcase, FileText, Lock,
  LogOut, AlertCircle, Loader2, Eye,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────
interface CoachProfile {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  specialite: string;
  bio: string;
  photo_url: string;
}

interface NotifPrefs {
  rappels_seances: boolean;
  nouveaux_clients: boolean;
  paiements: boolean;
  resume_hebdo: boolean;
}

type Tab = 'profil' | 'notifications' | 'securite';

// ─── Helpers ─────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-emerald-500' : 'bg-gray-200'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-[#1A2535] shadow ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
        ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
      }`}
    >
      {ok ? <Check size={16} /> : <AlertCircle size={16} />}
      {msg}
    </motion.div>
  );
}

// ─── Composant principal ─────────────────────────
export default function Settings() {
  const [tab, setTab] = useState<Tab>('profil');
  const [userId, setUserId] = useState<string>('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Profil
  const [profile, setProfile] = useState<CoachProfile>({
    prenom: '', nom: '', email: '', telephone: '',
    specialite: '', bio: '', photo_url: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notifications (stockées en localStorage)
  const [notifs, setNotifs] = useState<NotifPrefs>({
    rappels_seances: true,
    nouveaux_clients: true,
    paiements: false,
    resume_hebdo: false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Sécurité
  const [resetSent, setResetSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // ── Chargement initial ────────────────────────
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Profil depuis la table coachs
    const { data: coach } = await supabase
      .from('coachs')
      .select('prenom, nom, email, telephone')
      .eq('id', user.id)
      .maybeSingle();

    // Extra depuis localStorage (specialite, bio, photo_url)
    const extra = JSON.parse(localStorage.getItem(`coach_extra_${user.id}`) || '{}');

    setProfile({
      prenom:     (coach?.prenom === 'Nouveau' ? '' : coach?.prenom) ?? '',
      nom:        (coach?.nom === 'Coach' ? '' : coach?.nom) ?? '',
      email:      coach?.email ?? user.email ?? '',
      telephone:  coach?.telephone ?? '',
      specialite: extra.specialite ?? '',
      bio:        extra.bio ?? '',
      photo_url:  extra.photo_url ?? '',
    });

    // Notifications depuis localStorage
    const savedNotifs = JSON.parse(localStorage.getItem(`coach_notifs_${user.id}`) || 'null');
    if (savedNotifs) setNotifs(savedNotifs);
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Sauvegarde profil ─────────────────────────
  async function saveProfile() {
    setSavingProfile(true);
    try {
      // Mise à jour des colonnes qui existent dans la table coachs
      const { error } = await supabase
        .from('coachs')
        .update({
          prenom: profile.prenom || 'Coach',
          nom: profile.nom || 'Coach',
          telephone: profile.telephone,
        })
        .eq('id', userId);

      if (error) throw error;

      // Specialite, bio, photo_url → localStorage
      const extra = {
        specialite: profile.specialite,
        bio: profile.bio,
        photo_url: profile.photo_url,
      };
      localStorage.setItem(`coach_extra_${userId}`, JSON.stringify(extra));

      showToast('Profil enregistré avec succès');
    } catch {
      showToast('Erreur lors de la sauvegarde', false);
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Upload photo ──────────────────────────────
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('La photo doit faire moins de 2 Mo', false);
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${userId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        // Si le bucket n'existe pas encore, on stocke en base64 dans localStorage
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          setProfile(p => ({ ...p, photo_url: base64 }));
          const extra = JSON.parse(localStorage.getItem(`coach_extra_${userId}`) || '{}');
          extra.photo_url = base64;
          localStorage.setItem(`coach_extra_${userId}`, JSON.stringify(extra));
          showToast('Photo enregistrée localement');
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const photoUrl = urlData.publicUrl + `?t=${Date.now()}`;
      setProfile(p => ({ ...p, photo_url: photoUrl }));

      const extra = JSON.parse(localStorage.getItem(`coach_extra_${userId}`) || '{}');
      extra.photo_url = photoUrl;
      localStorage.setItem(`coach_extra_${userId}`, JSON.stringify(extra));

      showToast('Photo mise à jour');
    } catch {
      showToast('Erreur lors de l\'upload', false);
    } finally {
      setUploadingPhoto(false);
    }
  }

  // ── Sauvegarde notifications ──────────────────
  async function saveNotifs() {
    setSavingNotifs(true);
    try {
      localStorage.setItem(`coach_notifs_${userId}`, JSON.stringify(notifs));
      await new Promise(r => setTimeout(r, 400)); // Feedback visuel
      showToast('Préférences enregistrées');
    } finally {
      setSavingNotifs(false);
    }
  }

  // ── Réinitialisation mot de passe ─────────────
  async function sendPasswordReset() {
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        profile.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (error) throw error;
      setResetSent(true);
      showToast('Email de réinitialisation envoyé');
    } catch {
      showToast('Erreur lors de l\'envoi', false);
    } finally {
      setSendingReset(false);
    }
  }

  // ── Déconnexion tous appareils ────────────────
  async function signOutAll() {
    await supabase.auth.signOut({ scope: 'global' });
    window.location.href = '/login';
  }

  // ─────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profil', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'securite', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="max-w-2xl mx-auto py-2">
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      </AnimatePresence>

      <h1 className="text-2xl font-bold text-gray-800 dark:text-[#E8EDF5] mb-6">Paramètres</h1>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#243044] p-1 rounded-xl mb-8">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-[#1A2535] text-gray-800 dark:text-[#E8EDF5] shadow-sm'
                : 'text-gray-500 dark:text-[#8896A8] hover:text-gray-700 dark:hover:text-[#D4DAE6]'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFIL ─────────────────────────────── */}
      {tab === 'profil' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1A2535] rounded-2xl border border-gray-100 dark:border-[#2E3D55] shadow-sm overflow-hidden"
        >
          {/* Photo de profil */}
          <div className="p-6 border-b border-gray-100 dark:border-[#2E3D55] flex items-center gap-5">
            <div className="relative">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Photo de profil"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {profile.prenom?.[0]?.toUpperCase() || profile.nom?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-[#1A2535] border border-gray-200 dark:border-[#2E3D55] rounded-full flex items-center justify-center shadow hover:bg-gray-50 dark:hover:bg-[#243044] transition-colors"
                title="Changer la photo"
              >
                {uploadingPhoto
                  ? <Loader2 size={14} className="animate-spin text-emerald-500" />
                  : <Camera size={14} className="text-gray-600 dark:text-[#A8B4C4]" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-[#E8EDF5]">
                {profile.prenom || profile.nom || 'Mon profil'}
              </p>
              <p className="text-sm text-gray-500 dark:text-[#8896A8]">{profile.email}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 font-medium"
              >
                Changer la photo
              </button>
            </div>
          </div>

          {/* Formulaire */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-[#8896A8] mb-1.5">Prénom</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6B7A8D]" />
                  <input
                    type="text"
                    value={profile.prenom}
                    onChange={e => setProfile(p => ({ ...p, prenom: e.target.value }))}
                    placeholder="Votre prénom"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-[#8896A8] mb-1.5">Nom</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6B7A8D]" />
                  <input
                    type="text"
                    value={profile.nom}
                    onChange={e => setProfile(p => ({ ...p, nom: e.target.value }))}
                    placeholder="Votre nom"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-[#8896A8] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6B7A8D]" />
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-100 dark:border-[#2E3D55] rounded-xl text-sm bg-gray-50 dark:bg-[#0F1923] text-gray-400 dark:text-[#6B7A8D] cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-[#6B7A8D] mt-1">L'email ne peut pas être modifié ici</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-[#8896A8] mb-1.5">Téléphone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6B7A8D]" />
                <input
                  type="tel"
                  value={profile.telephone}
                  onChange={e => setProfile(p => ({ ...p, telephone: e.target.value }))}
                  placeholder="06 00 00 00 00"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-[#8896A8] mb-1.5">Spécialité</label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6B7A8D]" />
                <input
                  type="text"
                  value={profile.specialite}
                  onChange={e => setProfile(p => ({ ...p, specialite: e.target.value }))}
                  placeholder="Ex : Coach fitness, Préparateur physique..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-[#8896A8] mb-1.5">Bio courte</label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-3 text-gray-400 dark:text-[#6B7A8D]" />
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Quelques mots sur vous..."
                  rows={3}
                  maxLength={300}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all resize-none"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-[#6B7A8D] mt-1 text-right">{profile.bio.length}/300</p>
            </div>

            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {savingProfile
                ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</>
                : <><Save size={16} /> Enregistrer le profil</>
              }
            </button>
          </div>
        </motion.div>
      )}

      {/* ── NOTIFICATIONS ────────────────────────── */}
      {tab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1A2535] rounded-2xl border border-gray-100 dark:border-[#2E3D55] shadow-sm"
        >
          <div className="p-6 border-b border-gray-100 dark:border-[#2E3D55]">
            <h2 className="font-semibold text-gray-800 dark:text-[#E8EDF5]">Préférences de notifications</h2>
            <p className="text-sm text-gray-400 dark:text-[#6B7A8D] mt-0.5">Choisissez ce que vous souhaitez recevoir par email</p>
          </div>

          <div className="divide-y divide-gray-50">
            {[
              {
                key: 'rappels_seances' as keyof NotifPrefs,
                label: 'Rappels de séances',
                desc: 'Rappel 24h avant chaque séance planifiée',
              },
              {
                key: 'nouveaux_clients' as keyof NotifPrefs,
                label: 'Nouveaux clients',
                desc: 'Notification quand un client s\'inscrit',
              },
              {
                key: 'paiements' as keyof NotifPrefs,
                label: 'Paiements reçus',
                desc: 'Confirmation quand une facture est payée',
              },
              {
                key: 'resume_hebdo' as keyof NotifPrefs,
                label: 'Résumé hebdomadaire',
                desc: 'Bilan de votre semaine chaque lundi matin',
              },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-[#E8EDF5]">{item.label}</p>
                  <p className="text-xs text-gray-400 dark:text-[#6B7A8D] mt-0.5">{item.desc}</p>
                </div>
                <Toggle
                  checked={notifs[item.key]}
                  onChange={v => setNotifs(n => ({ ...n, [item.key]: v }))}
                />
              </div>
            ))}
          </div>

          <div className="p-5 border-t border-gray-100 dark:border-[#2E3D55]">
            <button
              onClick={saveNotifs}
              disabled={savingNotifs}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {savingNotifs
                ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</>
                : <><Save size={16} /> Enregistrer les préférences</>
              }
            </button>
          </div>
        </motion.div>
      )}

      {/* ── SÉCURITÉ ─────────────────────────────── */}
      {tab === 'securite' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Changer mot de passe */}
          <div className="bg-white dark:bg-[#1A2535] rounded-2xl border border-gray-100 dark:border-[#2E3D55] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-[#2E3D55]">
              <h2 className="font-semibold text-gray-800 dark:text-[#E8EDF5] flex items-center gap-2">
                <Lock size={18} className="text-emerald-500" />
                Changer de mot de passe
              </h2>
              <p className="text-sm text-gray-400 dark:text-[#6B7A8D] mt-1">
                Un email de réinitialisation sera envoyé à <strong>{profile.email}</strong>
              </p>
            </div>
            <div className="p-6">
              {resetSent ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <Check size={20} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Email envoyé !</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Vérifiez votre boîte mail et cliquez sur le lien pour créer votre nouveau mot de passe.
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={sendPasswordReset}
                  disabled={sendingReset}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-[#2E3D55] text-gray-700 dark:text-[#D4DAE6] py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-[#243044] transition-colors disabled:opacity-60"
                >
                  {sendingReset
                    ? <><Loader2 size={16} className="animate-spin" /> Envoi en cours...</>
                    : <><Mail size={16} /> Envoyer le lien de réinitialisation</>
                  }
                </button>
              )}
            </div>
          </div>

          {/* Sessions actives */}
          <div className="bg-white dark:bg-[#1A2535] rounded-2xl border border-gray-100 dark:border-[#2E3D55] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-[#2E3D55]">
              <h2 className="font-semibold text-gray-800 dark:text-[#E8EDF5] flex items-center gap-2">
                <Eye size={18} className="text-blue-500" />
                Sessions actives
              </h2>
              <p className="text-sm text-gray-400 dark:text-[#6B7A8D] mt-1">
                Appareils actuellement connectés à votre compte
              </p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-[#E8EDF5]">Session actuelle</p>
                  <p className="text-xs text-gray-500 dark:text-[#8896A8]">Navigateur web · Connecté maintenant</p>
                </div>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                  Actif
                </span>
              </div>
            </div>
          </div>

          {/* Déconnexion globale */}
          <div className="bg-white dark:bg-[#1A2535] rounded-2xl border border-red-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-red-50">
              <h2 className="font-semibold text-gray-800 dark:text-[#E8EDF5] flex items-center gap-2">
                <LogOut size={18} className="text-red-400" />
                Déconnexion de tous les appareils
              </h2>
              <p className="text-sm text-gray-400 dark:text-[#6B7A8D] mt-1">
                Vous serez déconnecté de tous vos appareils immédiatement.
              </p>
            </div>
            <div className="p-6">
              <button
                onClick={signOutAll}
                className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 py-3 rounded-xl font-medium hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Déconnecter tous les appareils
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
