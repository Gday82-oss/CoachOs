import { useEffect, useState } from 'react';
import { supabase, ensureCoachProfile } from '../lib/supabase';
import {
  Receipt, Plus, Download, Trash2, X, Check,
  Euro, Clock, AlertCircle, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoachInfo {
  id: string; prenom: string; nom: string; email: string;
  telephone?: string; siret?: string; adresse?: string;
}

interface ClientInfo { id: string; prenom: string; nom: string; email?: string; }

interface LigneFacture {
  description: string; quantite: number; prix_ht: number; taux_tva: number;
}

interface Facture {
  id: string;
  coach_id: string;
  client_id: string;
  numero: string;
  date_emission: string;
  date_echeance: string;
  statut: 'en_attente' | 'payee' | 'annulee';
  lignes: LigneFacture[];
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  notes?: string;
  date_paiement?: string | null;
  client?: { prenom: string; nom: string };
}

type Tab = 'factures' | 'suivi';

const STATUT_CONFIG = {
  payee:      { label: 'Payée',      bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-400' },
  en_attente: { label: 'En attente', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  annulee:    { label: 'Annulée',    bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400' },
};

// ─── Génération PDF facture ───────────────────────────────────────────────────

function genererPDFFacture(facture: Facture, coach: CoachInfo) {
  const doc = new jsPDF();
  const W = 210, M = 15;

  // En-tête
  doc.setFillColor(26, 43, 74);
  doc.rect(0, 0, W, 32, 'F');
  doc.setFillColor(0, 200, 150);
  doc.rect(0, 32, W, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FACTURE', M, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('MyCareCoach — Coaching sportif', M, 25);
  doc.setFontSize(12);
  doc.text(facture.numero, W - M, 16, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`Émise le : ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}`, W - M, 23, { align: 'right' });
  doc.text(`Échéance : ${new Date(facture.date_echeance).toLocaleDateString('fr-FR')}`, W - M, 29, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  let y = 42;

  // Blocs prestataire / client
  const BOX_H = 36;
  doc.setFillColor(247, 250, 252);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y, 85, BOX_H, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(0, 200, 150);
  doc.text('ÉMETTEUR', M + 3, y + 5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(26, 43, 74);
  doc.text(`${coach.prenom} ${coach.nom}`, M + 3, y + 12);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  let ly = y + 18;
  if (coach.adresse) { doc.text(coach.adresse, M + 3, ly, { maxWidth: 79 }); ly += 6; }
  if (coach.telephone) { doc.text(`Tél : ${coach.telephone}`, M + 3, ly); ly += 5; }
  if (coach.siret) { doc.setFont('helvetica', 'bold'); doc.text(`SIRET : ${coach.siret}`, M + 3, y + BOX_H - 3); }

  const RX = W / 2 + 5;
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(RX, y, 85, BOX_H, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(0, 200, 150);
  doc.text('CLIENT', RX + 3, y + 5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(26, 43, 74);
  doc.text(`${facture.client?.prenom || ''} ${facture.client?.nom || ''}`, RX + 3, y + 12);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
  doc.text('Destinataire de la facture', RX + 3, y + 18);

  y += BOX_H + 10;

  // Tableau prestations
  doc.setFillColor(26, 43, 74);
  doc.rect(M, y, W - 2 * M, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Description', M + 3, y + 4.5);
  doc.text('Qté', M + 98, y + 4.5, { align: 'right' });
  doc.text('P.U. HT', M + 122, y + 4.5, { align: 'right' });
  doc.text('TVA %', M + 144, y + 4.5, { align: 'right' });
  doc.text('Total HT', W - M - 3, y + 4.5, { align: 'right' });
  y += 7;

  facture.lignes.forEach((l, i) => {
    if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(M, y, W - 2 * M, 7, 'F'); }
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(l.description, M + 3, y + 4.5, { maxWidth: 85 });
    doc.text(String(l.quantite), M + 98, y + 4.5, { align: 'right' });
    doc.text(`${l.prix_ht.toFixed(2)} €`, M + 122, y + 4.5, { align: 'right' });
    doc.text(`${l.taux_tva} %`, M + 144, y + 4.5, { align: 'right' });
    doc.text(`${(l.quantite * l.prix_ht).toFixed(2)} €`, W - M - 3, y + 4.5, { align: 'right' });
    y += 7;
  });
  y += 4;

  // Totaux
  const totW = 80, totX = W - M - totW;
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
  doc.line(totX, y, W - M, y); y += 6;

  [[`Sous-total HT`, `${facture.montant_ht.toFixed(2)} €`],
   [`TVA`,           `${facture.montant_tva.toFixed(2)} €`]].forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
    doc.text(lbl, totX, y); doc.text(val, W - M, y, { align: 'right' }); y += 6;
  });

  doc.setFillColor(26, 43, 74);
  doc.roundedRect(totX - 2, y - 1, totW + 4, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('TOTAL TTC', totX, y + 6);
  doc.text(`${facture.montant_ttc.toFixed(2)} €`, W - M, y + 6, { align: 'right' });
  y += 16;

  // Mention acquittée
  if (facture.statut === 'payee' && facture.date_paiement) {
    doc.setFillColor(209, 250, 229);
    doc.setDrawColor(52, 211, 153);
    doc.roundedRect(M, y, W - 2 * M, 10, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(5, 150, 105);
    doc.text(
      `✓  Facture acquittée le ${new Date(facture.date_paiement).toLocaleDateString('fr-FR')}`,
      W / 2, y + 6.5, { align: 'center' },
    );
    y += 15;
  }

  // Notes
  if (facture.notes) {
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(`Note : ${facture.notes}`, W - 2 * M);
    doc.text(noteLines, M, y);
  }

  // Footer
  const FY = 285;
  doc.setFillColor(26, 43, 74); doc.rect(0, FY - 6, W, 12, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(200, 210, 220);
  const footer = coach.siret
    ? `SIRET : ${coach.siret}  —  TVA non applicable, art. 293B du CGI`
    : 'TVA non applicable, art. 293B du CGI';
  doc.text(footer, W / 2, FY, { align: 'center' });

  doc.save(`${facture.numero}.pdf`);
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface LigneForm { description: string; quantite: number; prix_ht: number; taux_tva: number; }

interface ModalForm {
  clientId: string;
  dateEmission: string;
  dateEcheance: string;
  lignes: LigneForm[];
  notes: string;
}

function defaultLigne(): LigneForm {
  return { description: 'Séance de coaching sportif', quantite: 1, prix_ht: 50, taux_tva: 0 };
}

function defaultModal(): ModalForm {
  const today    = new Date();
  const echeance = new Date(today); echeance.setDate(echeance.getDate() + 30);
  return {
    clientId:     '',
    dateEmission: today.toISOString().split('T')[0],
    dateEcheance: echeance.toISOString().split('T')[0],
    lignes:       [defaultLigne()],
    notes:        '',
  };
}

function calcTotaux(lignes: LigneForm[]) {
  const ht  = lignes.reduce((s, l) => s + l.quantite * l.prix_ht, 0);
  const tva = lignes.reduce((s, l) => s + l.quantite * l.prix_ht * (l.taux_tva / 100), 0);
  return { ht, tva, ttc: ht + tva };
}

export default function Facturation() {
  const [tab, setTab]               = useState<Tab>('factures');
  const [factures, setFactures]     = useState<Facture[]>([]);
  const [clients, setClients]       = useState<ClientInfo[]>([]);
  const [coach, setCoach]           = useState<CoachInfo | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal]           = useState<ModalForm>(defaultModal());
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await ensureCoachProfile(user);

      const [{ data: cd }, { data: fd }, { data: cld }] = await Promise.all([
        supabase.from('coachs').select('id,prenom,nom,email,telephone,siret,adresse').eq('id', user.id).maybeSingle(),
        supabase.from('factures').select('*, client:clients(prenom, nom)').eq('coach_id', user.id).order('date_emission', { ascending: false }),
        supabase.from('clients').select('id,prenom,nom,email').eq('coach_id', user.id).order('prenom'),
      ]);

      setCoach({ id: user.id, prenom: cd?.prenom || '', nom: cd?.nom || '', email: cd?.email || user.email || '', telephone: cd?.telephone, siret: cd?.siret, adresse: cd?.adresse });
      setFactures((fd || []).map(f => ({ ...f, lignes: Array.isArray(f.lignes) ? f.lignes : [] })));
      setClients(cld || []);
    } catch (e) {
      console.error('Facturation fetchData:', e);
    } finally {
      setLoading(false);
    }
  }

  async function getNextNumero(coachId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from('factures').select('numero')
      .eq('coach_id', coachId)
      .like('numero', `FAC-${year}-%`)
      .order('numero', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return `FAC-${year}-001`;
    const n = parseInt(data[0].numero.split('-')[2] || '0') + 1;
    return `FAC-${year}-${String(n).padStart(3, '0')}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coach) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const numero = await getNextNumero(user.id);
      const { ht, tva, ttc } = calcTotaux(modal.lignes);

      const { error } = await supabase.from('factures').insert([{
        coach_id:      user.id,
        client_id:     modal.clientId,
        numero,
        date_emission: modal.dateEmission,
        date_echeance: modal.dateEcheance,
        statut:        'en_attente',
        lignes:        modal.lignes,
        montant_ht:    Math.round(ht  * 100) / 100,
        montant_tva:   Math.round(tva * 100) / 100,
        montant_ttc:   Math.round(ttc * 100) / 100,
        notes:         modal.notes || null,
      }]);

      if (error) throw error;
      setShowModal(false);
      setModal(defaultModal());
      fetchData();
    } catch (e: any) {
      alert(`Erreur : ${e.message || 'Vérifiez que la table factures existe dans Supabase.'}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function marquerPayee(id: string) {
    const { error } = await supabase.from('factures').update({
      statut: 'payee',
      date_paiement: new Date().toISOString().split('T')[0],
    }).eq('id', id);
    if (error) {
      console.error('Erreur marquerPayee:', error);
      alert('Erreur lors de la mise à jour du statut');
      return;
    }
    await fetchData();
  }

  async function deleteFacture(id: string) {
    if (!confirm('Supprimer cette facture ?')) return;
    await supabase.from('factures').delete().eq('id', id);
    setFactures(prev => prev.filter(f => f.id !== id));
  }

  function downloadPDF(facture: Facture) {
    if (!coach) return;
    setGenerating(facture.id);
    try { genererPDFFacture(facture, coach); }
    finally { setTimeout(() => setGenerating(null), 500); }
  }

  function setLigne(i: number, field: keyof LigneForm, value: string | number) {
    setModal(m => ({
      ...m,
      lignes: m.lignes.map((l, j) => j === i ? { ...l, [field]: value } : l),
    }));
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalFacture   = factures.reduce((s, f) => s + f.montant_ttc, 0);
  const totalEncaisse  = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ttc, 0);
  const totalAttente   = factures.filter(f => f.statut === 'en_attente').reduce((s, f) => s + f.montant_ttc, 0);
  const facturesRetard = factures.filter(f => f.statut === 'en_attente' && new Date(f.date_echeance) < new Date());
  const totalRetard    = facturesRetard.reduce((s, f) => s + f.montant_ttc, 0);

  const { ht: mHT, tva: mTVA, ttc: mTTC } = calcTotaux(modal.lignes);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C896]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* ── En-tête ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-[#E8EDF5]">
            Facturation
          </h1>
          <p className="text-gray-500 dark:text-[#A8B4C4] mt-1">
            Gérez vos factures et suivez vos paiements
          </p>
        </div>
        {tab === 'factures' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 text-white px-5 py-3 rounded-xl shadow-lg min-h-[44px]"
            style={{ background: '#00C896' }}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nouvelle facture</span>
            <span className="sm:hidden">Facture</span>
          </button>
        )}
      </div>

      {/* ── Onglets ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-[#1A2535] p-1 rounded-xl w-fit">
        {([
          { key: 'factures', label: 'Factures' },
          { key: 'suivi',    label: 'Suivi paiements' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={tab === t.key
              ? { background: '#1A2B4A', color: 'white' }
              : { color: '#6b7280' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════ ONGLET FACTURES ════════════════════════════════════════════════ */}
      {tab === 'factures' && (
        <div>
          {factures.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55]">
              <div className="w-20 h-20 bg-gray-100 dark:bg-[#243044] rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-[#E8EDF5] mb-2">Aucune facture</h3>
              <p className="text-gray-500 dark:text-[#8896A8] mb-6">Créez votre première facture</p>
              <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl" style={{ background: '#00C896' }}>
                <Plus size={20} /> Nouvelle facture
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55] overflow-hidden">
              {/* Tableau desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#2E3D55]">
                      {['Numéro', 'Client', 'Date', 'Échéance', 'Montant TTC', 'Statut', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-[#8896A8] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {factures.map(f => {
                      const cfg = STATUT_CONFIG[f.statut];
                      const enRetard = f.statut === 'en_attente' && new Date(f.date_echeance) < new Date();
                      return (
                        <tr key={f.id} className="border-b border-gray-50 dark:border-[#2E3D55]/50 hover:bg-gray-50 dark:hover:bg-[#243044]/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-800 dark:text-[#E8EDF5]">{f.numero}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-[#C4CEDB]">{f.client?.prenom} {f.client?.nom}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#8896A8]">{new Date(f.date_emission).toLocaleDateString('fr-FR')}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={enRetard ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-[#8896A8]'}>
                              {new Date(f.date_echeance).toLocaleDateString('fr-FR')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-[#E8EDF5]">{f.montant_ttc.toFixed(2)} €</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => downloadPDF(f)} disabled={generating === f.id} title="Télécharger PDF" className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2E3D55] rounded-lg transition-colors text-gray-500 dark:text-[#8896A8]">
                                {generating === f.id ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 block" /> : <Download size={15} />}
                              </button>
                              {f.statut === 'en_attente' && (
                                <button onClick={() => marquerPayee(f.id)} title="Marquer payée" className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors text-green-600">
                                  <Check size={15} />
                                </button>
                              )}
                              <button onClick={() => deleteFacture(f.id)} title="Supprimer" className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-400">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-[#2E3D55]">
                {factures.map(f => {
                  const cfg = STATUT_CONFIG[f.statut];
                  return (
                    <div key={f.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-mono text-sm font-bold text-gray-800 dark:text-[#E8EDF5]">{f.numero}</p>
                          <p className="text-sm text-gray-600 dark:text-[#A8B4C4]">{f.client?.prenom} {f.client?.nom}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                          <span className="font-semibold text-gray-800 dark:text-[#E8EDF5]">{f.montant_ttc.toFixed(2)} €</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => downloadPDF(f)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-gray-200 dark:border-[#2E3D55] rounded-lg text-gray-600 dark:text-[#A8B4C4]">
                          <Download size={13} /> PDF
                        </button>
                        {f.statut === 'en_attente' && (
                          <button onClick={() => marquerPayee(f.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-green-300 rounded-lg text-green-600">
                            <Check size={13} /> Payée
                          </button>
                        )}
                        <button onClick={() => deleteFacture(f.id)} className="p-1.5 border border-red-200 rounded-lg text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ ONGLET SUIVI ═══════════════════════════════════════════════════ */}
      {tab === 'suivi' && (
        <div className="space-y-6">
          {/* Cards récap */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total facturé',  value: totalFacture,  icon: TrendingUp,   color: '#1A2B4A' },
              { label: 'Encaissé',       value: totalEncaisse, icon: Check,        color: '#059669' },
              { label: 'En attente',     value: totalAttente,  icon: Clock,        color: '#d97706' },
              { label: 'En retard',      value: totalRetard,   icon: AlertCircle,  color: '#dc2626' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-[#8896A8]">{label}</p>
                </div>
                <p className="text-xl font-bold" style={{ color }}>{value.toFixed(2)} €</p>
              </div>
            ))}
          </div>

          {/* Factures non payées */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-[#E8EDF5] mb-4">
              Factures en attente de paiement
            </h2>
            {factures.filter(f => f.statut === 'en_attente').length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55]">
                <Check size={32} className="text-green-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-[#A8B4C4]">Tout est à jour — aucune facture en attente !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {factures.filter(f => f.statut === 'en_attente').map(f => {
                  const enRetard = new Date(f.date_echeance) < new Date();
                  return (
                    <div key={f.id} className="bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55] p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-800 dark:text-[#E8EDF5]">{f.numero}</span>
                          {enRetard && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              En retard
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-[#A8B4C4]">
                          {f.client?.prenom} {f.client?.nom} — échéance {new Date(f.date_echeance).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-gray-800 dark:text-[#E8EDF5]">{f.montant_ttc.toFixed(2)} €</span>
                        <button
                          onClick={() => marquerPayee(f.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-xl"
                          style={{ background: '#059669' }}
                        >
                          <Check size={15} /> Payée
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ MODAL NOUVELLE FACTURE ═════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex md:items-center md:justify-center items-end z-50">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-white dark:bg-[#1A2535] rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#2E3D55] sticky top-0 bg-white dark:bg-[#1A2535] z-10">
                <h2 className="text-xl font-bold text-gray-800 dark:text-[#E8EDF5]">Nouvelle facture</h2>
                <button onClick={() => { setShowModal(false); setModal(defaultModal()); }} className="p-2 hover:bg-gray-100 dark:hover:bg-[#243044] rounded-xl transition-colors">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Client + dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#C4CEDB] mb-1">Client *</label>
                    <select
                      required value={modal.clientId}
                      onChange={e => setModal(m => ({ ...m, clientId: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] focus:ring-2 focus:ring-[#00C896]/30"
                    >
                      <option value="">— Choisir un client —</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#C4CEDB] mb-1">Date d'émission *</label>
                    <input type="date" required value={modal.dateEmission}
                      onChange={e => setModal(m => ({ ...m, dateEmission: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#C4CEDB] mb-1">Date d'échéance</label>
                    <input type="date" value={modal.dateEcheance}
                      onChange={e => setModal(m => ({ ...m, dateEcheance: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5]" />
                  </div>
                </div>

                {/* Lignes de prestation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-[#C4CEDB]">Prestations *</label>
                    <button type="button" onClick={() => setModal(m => ({ ...m, lignes: [...m.lignes, defaultLigne()] }))}
                      className="flex items-center gap-1 text-xs text-[#00C896] hover:underline">
                      <Plus size={14} /> Ajouter une ligne
                    </button>
                  </div>

                  {/* En-têtes */}
                  <div className="hidden md:grid grid-cols-12 gap-2 mb-1 text-xs text-gray-400 dark:text-[#8896A8] px-1">
                    <span className="col-span-5">Description</span>
                    <span className="col-span-2 text-center">Qté</span>
                    <span className="col-span-2 text-center">Prix HT (€)</span>
                    <span className="col-span-2 text-center">TVA %</span>
                    <span className="col-span-1" />
                  </div>

                  <div className="space-y-2">
                    {modal.lignes.map((l, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          className="col-span-12 md:col-span-5 px-3 py-2 text-sm border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5]"
                          value={l.description} placeholder="Description"
                          onChange={e => setLigne(i, 'description', e.target.value)}
                        />
                        <input type="number" min="1"
                          className="col-span-4 md:col-span-2 px-3 py-2 text-sm border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] text-center"
                          value={l.quantite}
                          onChange={e => setLigne(i, 'quantite', +e.target.value)}
                        />
                        <input type="number" min="0" step="0.01"
                          className="col-span-4 md:col-span-2 px-3 py-2 text-sm border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] text-center"
                          value={l.prix_ht}
                          onChange={e => setLigne(i, 'prix_ht', +e.target.value)}
                        />
                        <input type="number" min="0" max="100"
                          className="col-span-3 md:col-span-2 px-3 py-2 text-sm border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] text-center"
                          value={l.taux_tva}
                          onChange={e => setLigne(i, 'taux_tva', +e.target.value)}
                        />
                        <button type="button" onClick={() => setModal(m => ({ ...m, lignes: m.lignes.filter((_, j) => j !== i) }))}
                          disabled={modal.lignes.length === 1}
                          className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Totaux */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-[#243044] rounded-xl space-y-2">
                    {[
                      ['Sous-total HT', `${mHT.toFixed(2)} €`],
                      ['TVA',           `${mTVA.toFixed(2)} €`],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm text-gray-600 dark:text-[#A8B4C4]">
                        <span>{l}</span><span>{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-gray-800 dark:text-[#E8EDF5] pt-2 border-t border-gray-200 dark:border-[#2E3D55]">
                      <span>Total TTC</span>
                      <span style={{ color: '#00C896' }}>{mTTC.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#C4CEDB] mb-1">Notes (optionnel)</label>
                  <textarea rows={2} value={modal.notes}
                    onChange={e => setModal(m => ({ ...m, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] text-sm resize-none"
                    placeholder="Informations complémentaires…"
                  />
                </div>

                {/* Mention TVA */}
                <p className="text-xs text-gray-400 dark:text-[#8896A8]">
                  <Euro size={12} className="inline mr-1" />
                  TVA non applicable — art. 293B du CGI (auto-entrepreneur)
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setShowModal(false); setModal(defaultModal()); }}
                    className="flex-1 py-3 border border-gray-200 dark:border-[#2E3D55] rounded-xl text-gray-600 dark:text-[#A8B4C4] hover:bg-gray-50 dark:hover:bg-[#243044] transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-3 text-white rounded-xl font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: '#00C896' }}>
                    {submitting
                      ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      : <Receipt size={18} />}
                    {submitting ? 'Création…' : 'Créer la facture'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
