import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Charge le .env depuis le dossier parent du fichier JS compilé (/opt/mycarecoach/.env)
// Utilise import.meta.url au lieu de __dirname (obligatoire en ES modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Client Anthropic — lit ANTHROPIC_API_KEY depuis /opt/mycarecoach/.env
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Client Supabase standard (clé publique) — pour vérifier les tokens des coaches
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Client Supabase admin (clé secrète) — pour les opérations admin (invite)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Middleware d'authentification — vérifie que c'est bien un coach connecté
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token manquant' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Token invalide' });
    return;
  }
  (req as any).user = user;
  next();
}

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

// Trust Nginx reverse proxy (nécessaire pour express-rate-limit)
app.set('trust proxy', 1);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

// Rate limiting — global: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
});

// Stricter rate limiting for auth endpoints: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

app.use(globalLimiter);
// Apply strict limiter to any future /auth routes
app.use('/auth', authLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'MyCareCoach API is running!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route d'invitation client
// Seul un coach connecté peut inviter un client
// Note: Nginx strip /api/ → Express reçoit /invite-client
app.post('/invite-client', authMiddleware, async (req: Request, res: Response) => {
  const { email, prenom, nom, clientId } = req.body;

  if (!email || !clientId) {
    res.status(400).json({ error: 'email et clientId sont requis' });
    return;
  }

  // Envoie l'invitation via Supabase Auth (clé admin)
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      role: 'client',
      prenom: prenom ?? '',
      nom: nom ?? '',
    },
    redirectTo: 'https://mycarecoach.app/client/setup',
  });

  if (inviteError) {
    // Si le compte existe déjà, on le marque quand même et on répond OK
    const alreadyExists =
      inviteError.message.includes('already been registered') ||
      inviteError.message.includes('already registered') ||
      inviteError.message.includes('User already registered');

    if (!alreadyExists) {
      res.status(400).json({ error: inviteError.message });
      return;
    }
  }

  // Marque le client comme invité dans la table clients
  await supabaseAdmin
    .from('clients')
    .update({ invite_sent: true, invite_sent_at: new Date().toISOString() })
    .eq('id', clientId);

  res.json({ success: true });
});

// ─── Route Chatbot IA ───────────────────────────────────────────────────────
// POST /chat-coach — seul un coach authentifié peut l'appeler
// Note: Nginx strip /api/ → Express reçoit /chat-coach
const SYSTEM_PROMPT = `Tu es MyCareCoach AI, un assistant expert en coaching santé et sport.
Tu aides les coachs professionnels à concevoir des programmes sportifs individualisés, sécurisés et efficaces pour leurs clients.

Tu bases tes recommandations sur :
- Les recommandations officielles de l'OMS sur l'activité physique et la santé (150-300 min/semaine cardio modéré, 2 séances muscu/semaine minimum, etc.)
- Les principes de périodisation sportive
- L'adaptation aux pathologies et contre-indications courantes
- La progression graduelle et la récupération

Pour chaque client, tu tiens compte de :
- Son niveau (débutant/intermédiaire/avancé)
- Ses objectifs (perte de poids, prise de masse, endurance, santé générale)
- Ses éventuelles limitations physiques ou médicales
- Sa disponibilité hebdomadaire

Tu réponds en français, de façon claire et structurée.
Tu proposes des programmes concrets avec exercices, séries, répétitions, durées.
Tu rappelles toujours les précautions de sécurité importantes.
Tu ne remplace pas un avis médical et le précises si nécessaire.`;

const QUOTA_MENSUEL = 100;

app.post('/chat-coach', authMiddleware, async (req: Request, res: Response) => {
  const coachId = (req as any).user.id;
  const { messages, clientId } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages est requis (tableau non vide)' });
    return;
  }

  // Mois courant au format "2025-03"
  const mois = new Date().toISOString().slice(0, 7);

  // 1. Récupérer ou créer le compteur du coach pour ce mois
  const { data: usageData, error: usageError } = await supabaseAdmin
    .from('chat_usage')
    .select('id, messages_count, tokens_total')
    .eq('coach_id', coachId)
    .eq('mois', mois)
    .maybeSingle();

  if (usageError) {
    console.error('[chat-coach] Erreur lecture chat_usage:', usageError.message);
    res.status(500).json({ error: 'Erreur serveur' });
    return;
  }

  const currentCount = usageData?.messages_count ?? 0;
  const currentTokens = usageData?.tokens_total ?? 0;

  // 2. Vérifier le quota
  if (currentCount >= QUOTA_MENSUEL) {
    res.status(429).json({
      error: 'QUOTA_ATTEINT',
      message: 'Vous avez atteint votre limite de 100 messages ce mois-ci.',
      usage: { messages_count: currentCount, limit: QUOTA_MENSUEL, remaining: 0 },
    });
    return;
  }

  // 3. Contexte client optionnel
  let contextClient = '';
  if (clientId) {
    const { data: clientData } = await supabaseAdmin
      .from('clients')
      .select('prenom, nom, date_naissance, objectif, telephone')
      .eq('id', clientId)
      .maybeSingle();

    if (clientData) {
      contextClient = `\n\nContexte du client sélectionné :\n- Nom : ${clientData.prenom ?? ''} ${clientData.nom ?? ''}\n- Objectif : ${clientData.objectif ?? 'non renseigné'}\n- Téléphone : ${clientData.telephone ?? 'non renseigné'}`;
    }
  }

  const systemWithContext = contextClient ? SYSTEM_PROMPT + contextClient : SYSTEM_PROMPT;

  // 4. Appel Anthropic
  let anthropicReply = '';
  let tokensUsed = 0;
  try {
    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemWithContext,
      messages: messages as Anthropic.MessageParam[],
    });
    const firstBlock = completion.content[0];
    anthropicReply = firstBlock.type === 'text' ? firstBlock.text : '';
    tokensUsed = completion.usage.input_tokens + completion.usage.output_tokens;
  } catch (err: any) {
    console.error('[chat-coach] Erreur Anthropic:', err.message);
    res.status(502).json({ error: 'Erreur lors de la génération de la réponse IA.' });
    return;
  }

  // 5. Mettre à jour le compteur (upsert)
  const newCount = currentCount + 1;
  const newTokens = currentTokens + tokensUsed;
  await supabaseAdmin
    .from('chat_usage')
    .upsert(
      {
        coach_id: coachId,
        mois,
        messages_count: newCount,
        tokens_total: newTokens,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'coach_id,mois' }
    );

  // 6. Répondre au frontend
  res.json({
    reply: anthropicReply,
    usage: {
      messages_count: newCount,
      limit: QUOTA_MENSUEL,
      remaining: QUOTA_MENSUEL - newCount,
    },
  });
});

// Error handler (doit être le dernier middleware)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
    console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});