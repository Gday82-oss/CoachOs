import { useEffect, useState } from 'react';
import { supabase, ensureCoachProfile } from '../lib/supabase';
import { FileText, Download, Plus, Trash2, X, Mail, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoachInfo {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  siret?: string;
  adresse?: string;
}

interface ClientInfo {
  id: string;
  prenom: string;
  nom: string;
  email?: string;
}

interface Attestation {
  id: string;
  mois?: number | null;
  annee: number;
  annee_complete?: boolean;
  nombre_seances: number;
  montant_total: number;
  date_emission: string;
  client_id: string;
  type_attestation?: 'mutuelle' | 'credit_impot';
  client?: { prenom: string; nom: string };
}

const MOIS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

// ─── Montant en lettres (français) ───────────────────────────────────────────

function montantEnLettres(montant: number): string {
  const entier = Math.floor(montant);
  const cents  = Math.round((montant - entier) * 100);

  const units = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
    'dix','onze','douze','treize','quatorze','quinze','seize',
    'dix-sept','dix-huit','dix-neuf'];
  const diz   = ['','dix','vingt','trente','quarante','cinquante','soixante'];

  function deux(n: number): string {
    if (n <= 0) return '';
    if (n < 20) return units[n];
    const d = Math.floor(n / 10), u = n % 10;
    if (d <= 6) {
      if (u === 0) return diz[d];
      if (u === 1) return diz[d] + '-et-un';
      return diz[d] + '-' + units[u];
    }
    if (d === 7) return u === 1 ? 'soixante-et-onze' : 'soixante-' + units[10 + u];
    if (d === 8) return u === 0 ? 'quatre-vingts' : 'quatre-vingt-' + units[u];
    return 'quatre-vingt-' + units[10 + u]; // 90-99
  }

  function trois(n: number): string {
    if (n < 100) return deux(n);
    const c = Math.floor(n / 100), r = n % 100;
    const cStr = c === 1 ? 'cent' : units[c] + ' cent' + (r === 0 ? 's' : '');
    return r === 0 ? cStr : cStr + ' ' + deux(r);
  }

  function conv(n: number): string {
    if (n === 0) return 'zéro';
    if (n < 1000) return trois(n);
    const m = Math.floor(n / 1000), r = n % 1000;
    const mStr = m === 1 ? 'mille' : trois(m) + ' mille';
    return r === 0 ? mStr : mStr + ' ' + trois(r);
  }

  let s = conv(entier) + (entier > 1 ? ' euros' : ' euro');
  if (cents > 0) s += ' et ' + deux(cents) + (cents > 1 ? ' centimes' : ' centime');
  return s;
}

// ─── Génération PDF ───────────────────────────────────────────────────────────

async function genererPDF(
  att: Attestation,
  coach: CoachInfo,
  seances: { date: string }[],
) {
  const doc  = new jsPDF();
  const W    = 210;
  const M    = 15; // margin gauche/droite

  // ── En-tête colorée ──────────────────────────────────────────────────────
  doc.setFillColor(26, 43, 74);
  doc.rect(0, 0, W, 32, 'F');
  doc.setFillColor(0, 200, 150);
  doc.rect(0, 32, W, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ATTESTATION DE PAIEMENT', W / 2, 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('COACHING SPORTIF', W / 2, 24, { align: 'center' });

  // ── Numéro & date ─────────────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  const periodeStr = att.annee_complete
    ? `Année ${att.annee}`
    : `${MOIS[(att.mois || 1) - 1]} ${att.annee}`;
  const ref = `ATT-${att.annee}-${String(att.client_id).slice(-4).toUpperCase()}`;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Réf. : ${ref}`, W - M, 40, { align: 'right' });
  doc.text(`Émise le : ${new Date(att.date_emission).toLocaleDateString('fr-FR')}`, W - M, 45, { align: 'right' });

  // ── Blocs prestataire / client ────────────────────────────────────────────
  let y = 50;
  const BOX_H = 38;

  // Prestataire (gauche)
  doc.setFillColor(247, 250, 252);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(M, y, 85, BOX_H, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(0, 200, 150);
  doc.text('PRESTATAIRE', M + 3, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 43, 74);
  doc.text(`${coach.prenom} ${coach.nom}`, M + 3, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  let lineY = y + 19;
  if (coach.adresse) { doc.text(coach.adresse, M + 3, lineY, { maxWidth: 79 }); lineY += 6; }
  if (coach.telephone) { doc.text(`Tél : ${coach.telephone}`, M + 3, lineY); lineY += 5; }
  doc.text(coach.email, M + 3, lineY);
  if (coach.siret) {
    doc.setFont('helvetica', 'bold');
    doc.text(`SIRET : ${coach.siret}`, M + 3, y + BOX_H - 4);
    doc.setFont('helvetica', 'normal');
  }

  // Client (droite)
  const RX = W / 2 + 5;
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(RX, y, 85, BOX_H, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(0, 200, 150);
  doc.text('CLIENT(E)', RX + 3, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 43, 74);
  doc.text(`${att.client?.prenom || ''} ${att.client?.nom || ''}`, RX + 3, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('Bénéficiaire des prestations', RX + 3, y + 19);

  y += BOX_H + 8;

  // ── Séparateur ────────────────────────────────────────────────────────────
  doc.setDrawColor(0, 200, 150);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 8;

  // ── Détails de la prestation ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 43, 74);
  doc.text('DÉTAILS DE LA PRESTATION', M, y);
  y += 7;

  const details: [string, string][] = [
    ['Période', periodeStr],
    ['Nombre de séances', String(att.nombre_seances)],
    ['Montant total', `${att.montant_total.toFixed(2)} €`],
    ['Type d\'attestation', att.type_attestation === 'credit_impot'
      ? 'Crédit d\'impôt services à la personne'
      : 'Remboursement mutuelle'],
  ];
  details.forEach(([label, val]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`${label} :`, M, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(val, M + 60, y);
    y += 6;
  });

  y += 4;

  // ── Tableau des séances ───────────────────────────────────────────────────
  if (seances.length > 0) {
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(26, 43, 74);
    doc.text('DÉTAIL DES SÉANCES', M, y);
    y += 5;

    // En-tête tableau
    doc.setFillColor(26, 43, 74);
    doc.rect(M, y, W - 2 * M, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Date', M + 3, y + 4.5);
    doc.text('Prestation', M + 45, y + 4.5);
    doc.text('Montant', W - M - 3, y + 4.5, { align: 'right' });
    y += 7;

    const tarifUnit = att.nombre_seances > 0
      ? att.montant_total / att.nombre_seances
      : 0;

    seances.forEach((s, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(M, y, W - 2 * M, 6, 'F');
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const d = new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR');
      doc.text(d, M + 3, y + 4);
      doc.text('Séance de coaching sportif', M + 45, y + 4);
      doc.text(`${tarifUnit.toFixed(2)} €`, W - M - 3, y + 4, { align: 'right' });
      y += 6;
    });

    // Total
    doc.setFillColor(0, 200, 150);
    doc.rect(M, y, W - 2 * M, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL', M + 3, y + 4.5);
    doc.text(`${att.montant_total.toFixed(2)} €`, W - M - 3, y + 4.5, { align: 'right' });
    y += 12;
  }

  y += 4;

  // ── Mention légale ────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 43, 74);
  doc.text('ATTESTATION SUR L\'HONNEUR', M, y);
  y += 6;

  const coachFull  = `${coach.prenom} ${coach.nom}`;
  const clientFull = `${att.client?.prenom || ''} ${att.client?.nom || ''}`;
  const enLettres  = montantEnLettres(att.montant_total);
  const mention = `Je soussigné(e) ${coachFull}, certifie avoir dispensé et perçu la somme de ${enLettres} (${att.montant_total.toFixed(2)} €) au titre des séances de coaching sportif pour ${clientFull} durant la période ${periodeStr}.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const mentionLines = doc.splitTextToSize(mention, W - 2 * M);
  doc.text(mentionLines, M, y);
  y += mentionLines.length * 5 + 6;

  // ── Mention crédit d'impôt ────────────────────────────────────────────────
  if (att.type_attestation === 'credit_impot') {
    doc.setFillColor(219, 234, 254);
    doc.setDrawColor(147, 197, 253);
    doc.roundedRect(M, y, W - 2 * M, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175);
    doc.text(
      'Prestation éligible au crédit d\'impôt services à la personne (art. 199 sexdecies du CGI)',
      M + 3, y + 5,
    );
    doc.text(
      `Crédit d\'impôt de 50 % — Montant déductible : ${(att.montant_total / 2).toFixed(2)} €`,
      M + 3, y + 10,
    );
    y += 18;
  }

  y += 6;

  // ── Zone signature ────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('fr-FR');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Fait le : ${today}`, M, y);
  doc.text('Signature du prestataire :', W / 2 + 5, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text(coachFull, W * 3 / 4, y, { align: 'center' });

  // ── Pied de page ──────────────────────────────────────────────────────────
  const FY = 285;
  doc.setFillColor(26, 43, 74);
  doc.rect(0, FY - 6, W, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(200, 210, 220);
  const footerTxt = coach.siret
    ? `SIRET : ${coach.siret}  —  TVA non applicable, art. 293B du CGI`
    : 'TVA non applicable, art. 293B du CGI';
  doc.text(footerTxt, W / 2, FY, { align: 'center' });

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const fname = `attestation_${att.client?.nom || 'client'}_${periodeStr.replace(/ /g, '_')}.pdf`;
  doc.save(fname);
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface FormState {
  clientId: string;
  periodeType: 'mois' | 'annee';
  mois: number;
  annee: number;
  montantMode: 'auto' | 'manuel';
  montantManuel: string;
  nbSeancesManuel: string;
  typeAttestation: 'mutuelle' | 'credit_impot';
}

const defaultForm = (): FormState => ({
  clientId: '',
  periodeType: 'mois',
  mois: new Date().getMonth() + 1,
  annee: new Date().getFullYear(),
  montantMode: 'auto',
  montantManuel: '',
  nbSeancesManuel: '',
  typeAttestation: 'mutuelle',
});

export default function Attestations() {
  const [attestations, setAttestations]   = useState<Attestation[]>([]);
  const [clients, setClients]             = useState<ClientInfo[]>([]);
  const [coach, setCoach]                 = useState<CoachInfo | null>(null);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [generating, setGenerating]       = useState<string | null>(null);
  const [form, setForm]                   = useState<FormState>(defaultForm());

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await ensureCoachProfile(user);

      const [{ data: coachData }, { data: attsData }, { data: clientsData }] = await Promise.all([
        supabase.from('coachs')
          .select('id, prenom, nom, email, telephone, siret, adresse')
          .eq('id', user.id)
          .maybeSingle(),
        supabase.from('attestations')
          .select('*, client:clients(prenom, nom)')
          .eq('coach_id', user.id)
          .order('date_emission', { ascending: false }),
        supabase.from('clients')
          .select('id, prenom, nom, email')
          .eq('coach_id', user.id)
          .order('prenom'),
      ]);

      setCoach({
        id:        user.id,
        prenom:    coachData?.prenom   || '',
        nom:       coachData?.nom      || '',
        email:     coachData?.email    || user.email || '',
        telephone: coachData?.telephone,
        siret:     coachData?.siret,
        adresse:   coachData?.adresse,
      });
      setAttestations(attsData || []);
      setClients(clientsData || []);
    } catch (e) {
      console.error('Attestations fetchData:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coach) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let nbSeances = 0;
      let montant   = 0;

      if (form.montantMode === 'auto') {
        const debut = form.periodeType === 'annee'
          ? `${form.annee}-01-01`
          : `${form.annee}-${String(form.mois).padStart(2, '0')}-01`;
        const fin   = form.periodeType === 'annee'
          ? `${form.annee}-12-31`
          : `${form.annee}-${String(form.mois).padStart(2, '0')}-31`;

        const { data: seancesData } = await supabase
          .from('seances')
          .select('id, tarif')
          .eq('coach_id', user.id)
          .eq('client_id', form.clientId)
          .eq('fait', true)
          .gte('date', debut)
          .lte('date', fin);

        nbSeances = seancesData?.length || 0;
        montant   = seancesData?.reduce((s, r) => s + (r.tarif || 50), 0) || 0;
        if (montant === 0 && nbSeances > 0) montant = nbSeances * 50;
      } else {
        nbSeances = parseInt(form.nbSeancesManuel) || 0;
        montant   = parseFloat(form.montantManuel)  || 0;
      }

      await supabase.from('attestations').insert([{
        coach_id:         user.id,
        client_id:        form.clientId,
        mois:             form.periodeType === 'annee' ? null : form.mois,
        annee:            form.annee,
        annee_complete:   form.periodeType === 'annee',
        nombre_seances:   nbSeances,
        montant_total:    montant,
        type_attestation: form.typeAttestation,
        date_emission:    new Date().toISOString().split('T')[0],
      }]);

      setShowModal(false);
      setForm(defaultForm());
      fetchData();
    } catch (e) {
      console.error('handleSubmit:', e);
      alert('Erreur lors de la création. Vérifiez que la table attestations a les colonnes type_attestation et annee_complete.');
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadPDF(att: Attestation) {
    if (!coach) return;
    setGenerating(att.id);
    try {
      const debut = att.annee_complete
        ? `${att.annee}-01-01`
        : `${att.annee}-${String(att.mois || 1).padStart(2, '0')}-01`;
      const fin   = att.annee_complete
        ? `${att.annee}-12-31`
        : `${att.annee}-${String(att.mois || 1).padStart(2, '0')}-31`;

      const { data } = await supabase
        .from('seances')
        .select('date')
        .eq('coach_id', coach.id)
        .eq('client_id', att.client_id)
        .eq('fait', true)
        .gte('date', debut)
        .lte('date', fin)
        .order('date');

      await genererPDF(att, coach, data || []);
    } catch (e) {
      console.error('downloadPDF:', e);
    } finally {
      setGenerating(null);
    }
  }

  async function deleteAttestation(id: string) {
    if (!confirm('Supprimer cette attestation ?')) return;
    await supabase.from('attestations').delete().eq('id', id);
    setAttestations(prev => prev.filter(a => a.id !== id));
  }

  function sendEmail(att: Attestation) {
    const client = clients.find(c => c.id === att.client_id);
    const email  = client?.email || '';
    const periodeStr = att.annee_complete
      ? `Année ${att.annee}`
      : `${MOIS[(att.mois || 1) - 1]} ${att.annee}`;
    const sujet = encodeURIComponent(`Attestation de paiement - ${periodeStr}`);
    const corps = encodeURIComponent(
      `Bonjour ${att.client?.prenom || ''},\n\n` +
      `Veuillez trouver ci-joint votre attestation de paiement pour la période ${periodeStr}.\n\n` +
      `Montant : ${att.montant_total.toFixed(2)} € — ${att.nombre_seances} séance(s).\n\n` +
      `Cordialement,\n${coach?.prenom} ${coach?.nom}`,
    );
    window.open(`mailto:${email}?subject=${sujet}&body=${corps}`);
  }

  const periodeLabel = (att: Attestation) =>
    att.annee_complete
      ? `Année ${att.annee}`
      : `${MOIS[(att.mois || 1) - 1]} ${att.annee}`;

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
            Attestations
          </h1>
          <p className="text-gray-500 dark:text-[#A8B4C4] mt-1">
            Documents de paiement pour mutuelle et crédit d'impôt
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-white px-5 py-3 rounded-xl shadow-lg min-h-[44px]"
          style={{ background: '#00C896' }}
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Générer attestation</span>
          <span className="sm:hidden">Générer</span>
        </button>
      </div>

      {/* ── Info box ─────────────────────────────────────────────────────────── */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6 flex gap-3">
        <Info className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={20} />
        <div>
          <p className="font-medium text-blue-900 dark:text-blue-300">Remboursement &amp; avantage fiscal</p>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
            Ces attestations permettent à vos clients de se faire rembourser par leur mutuelle
            ou de bénéficier du crédit d'impôt services à la personne (50 % — art. 199 sexdecies du CGI).
          </p>
        </div>
      </div>

      {/* ── Liste ────────────────────────────────────────────────────────────── */}
      {attestations.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55]">
          <div className="w-20 h-20 bg-gray-100 dark:bg-[#243044] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-[#E8EDF5] mb-2">
            Aucune attestation
          </h3>
          <p className="text-gray-500 dark:text-[#8896A8] mb-6">
            Générez votre première attestation
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl"
            style={{ background: '#00C896' }}
          >
            <Plus size={20} /> Générer attestation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {attestations.map((att, idx) => (
            <motion.div
              key={att.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm border border-gray-100 dark:border-[#2E3D55] p-5"
            >
              {/* Ligne titre */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,200,150,0.12)' }}>
                    <FileText size={22} style={{ color: '#00C896' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-[#E8EDF5]">
                      {att.client?.prenom} {att.client?.nom}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-[#8896A8]">
                      {periodeLabel(att)}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={att.type_attestation === 'credit_impot'
                    ? { background: 'rgba(59,130,246,0.12)', color: '#2563eb' }
                    : { background: 'rgba(0,200,150,0.12)', color: '#059669' }}
                >
                  {att.type_attestation === 'credit_impot' ? 'Crédit d\'impôt' : 'Mutuelle'}
                </span>
              </div>

              {/* Détails */}
              <div className="flex gap-4 text-sm text-gray-600 dark:text-[#A8B4C4] mb-4">
                <span>{att.nombre_seances} séance{att.nombre_seances > 1 ? 's' : ''}</span>
                <span className="font-semibold text-gray-800 dark:text-[#E8EDF5]">
                  {att.montant_total.toFixed(2)} €
                </span>
                <span>{new Date(att.date_emission).toLocaleDateString('fr-FR')}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => downloadPDF(att)}
                  disabled={generating === att.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border rounded-lg transition-colors"
                  style={{ borderColor: '#00C896', color: '#00C896' }}
                >
                  {generating === att.id
                    ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00C896]" />
                    : <Download size={15} />}
                  PDF
                </button>
                <button
                  onClick={() => sendEmail(att)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Mail size={15} /> Email
                </button>
                <button
                  onClick={() => deleteAttestation(att.id)}
                  className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Modal génération ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex md:items-center md:justify-center items-end z-50">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-white dark:bg-[#1A2535] rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#2E3D55] sticky top-0 bg-white dark:bg-[#1A2535] z-10">
                <h2 className="text-xl font-bold text-gray-800 dark:text-[#E8EDF5]">
                  Nouvelle attestation
                </h2>
                <button
                  onClick={() => { setShowModal(false); setForm(defaultForm()); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#243044] rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#C4CEDB] mb-1">
                    Client *
                  </label>
                  <select
                    required
                    value={form.clientId}
                    onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] focus:ring-2 focus:ring-[#00C896]/30 focus:border-[#00C896]"
                  >
                    <option value="">— Choisir un client —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Type période */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#C4CEDB] mb-2">
                    Période *
                  </label>
                  <div className="flex gap-3 mb-3">
                    {(['mois', 'annee'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, periodeType: t }))}
                        className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors"
                        style={form.periodeType === t
                          ? { background: '#00C896', color: 'white', borderColor: '#00C896' }
                          : { borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {t === 'mois' ? 'Mois précis' : 'Année complète'}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {form.periodeType === 'mois' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Mois</label>
                        <select
                          value={form.mois}
                          onChange={e => setForm(f => ({ ...f, mois: +e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] text-sm"
                        >
                          {MOIS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                      </div>
                    )}
                    <div className={form.periodeType === 'annee' ? 'col-span-2' : ''}>
                      <label className="block text-xs text-gray-500 mb-1">Année</label>
                      <select
                        value={form.annee}
                        onChange={e => setForm(f => ({ ...f, annee: +e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] text-sm"
                      >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#C4CEDB] mb-2">
                    Montant
                  </label>
                  <div className="flex gap-3 mb-3">
                    {(['auto', 'manuel'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, montantMode: m }))}
                        className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors"
                        style={form.montantMode === m
                          ? { background: '#00C896', color: 'white', borderColor: '#00C896' }
                          : { borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {m === 'auto' ? 'Calculer automatiquement' : 'Saisie manuelle'}
                      </button>
                    ))}
                  </div>
                  {form.montantMode === 'auto' && (
                    <p className="text-xs text-gray-500 dark:text-[#8896A8] bg-gray-50 dark:bg-[#243044] p-3 rounded-xl">
                      Le montant et le nombre de séances seront calculés depuis vos séances effectuées sur la période.
                    </p>
                  )}
                  {form.montantMode === 'manuel' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nb séances</label>
                        <input
                          type="number" min="1"
                          value={form.nbSeancesManuel}
                          onChange={e => setForm(f => ({ ...f, nbSeancesManuel: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] text-sm"
                          placeholder="Ex : 8"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Montant (€)</label>
                        <input
                          type="number" min="0" step="0.01"
                          value={form.montantManuel}
                          onChange={e => setForm(f => ({ ...f, montantManuel: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-[#2E3D55] rounded-xl bg-white dark:bg-[#243044] dark:text-[#E8EDF5] text-sm"
                          placeholder="Ex : 400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Type attestation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#C4CEDB] mb-2">
                    Type d'attestation *
                  </label>
                  <div className="flex gap-3">
                    {([
                      { value: 'mutuelle',      label: 'Mutuelle',        color: '#059669' },
                      { value: 'credit_impot',  label: 'Crédit d\'impôt', color: '#2563eb' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, typeAttestation: opt.value }))}
                        className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors"
                        style={form.typeAttestation === opt.value
                          ? { background: opt.color, color: 'white', borderColor: opt.color }
                          : { borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setForm(defaultForm()); }}
                    className="flex-1 py-3 border border-gray-200 dark:border-[#2E3D55] rounded-xl text-gray-600 dark:text-[#A8B4C4] hover:bg-gray-50 dark:hover:bg-[#243044] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 text-white rounded-xl font-medium disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
                    style={{ background: '#00C896' }}
                  >
                    {submitting
                      ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      : <Plus size={18} />}
                    {submitting ? 'Génération…' : 'Générer'}
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
