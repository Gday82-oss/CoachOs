import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

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

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

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
app.post('/api/invite-client', authMiddleware, async (req: Request, res: Response) => {
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

// Error handler (doit être le dernier middleware)
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
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