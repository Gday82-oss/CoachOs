import { Telegraf, Context } from 'telegraf';
import { Octokit } from '@octokit/rest';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { logger } from './utils/logger';
import { obiCode } from './agents/obi-code';

dotenv.config();

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'Gday82-oss/CoachOs';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const GROUP_LINK = process.env.TELEGRAM_GROUP_LINK || '';

// ID du groupe
let GROUP_ID: string | undefined;

// Initialisation
const bot = new Telegraf(BOT_TOKEN);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ==================== COLLABORATION KIMI-CLAW ====================

// Détecte si besoin d'escalade vers Kimi-Claw
function needsKimiEscalation(message: string): boolean {
  const complexKeywords = [
    'architecture', 'scalable', 'microservices', 'database', 'sharding',
    'kubernetes', 'docker', 'aws', 'gcp', 'azure', 'cloud',
    'sécurité', 'auth', 'oauth', 'encryption', 'compliance',
    'performance', 'optimisation', 'caching', 'cdn',
    'monetisation', 'stripe', 'payment', 'billing',
    'ia', 'ml', 'ai', 'embedding', 'vector', 'llm'
  ];
  
  return complexKeywords.some(kw => message.toLowerCase().includes(kw));
}

// Message d'escalade
function getKimiEscalationMessage(topic: string): string {
  return `
🤖💬 *Obi-Code → Kimi-Claw*

"Un problème complexe je détecte. Appeler le Maître, je dois."

🎯 *Sujet:* ${topic}

Ce sujet nécessite l'expertise de @KimiClaw (architecture, stratégie, décisions complexes).

⏳ *En attente de réponse...*

En attendant, je peux t'aider avec:
• Le monitoring
• Les déploiements  
• La qualité du code
• Les commandes /obi
  `;
}

// ==================== MIDDLEWARE ====================

bot.use((ctx, next) => {
  const text = (ctx.message as any)?.text;
  logger.info(`Message de ${ctx.from?.username || 'unknown'}: ${text?.substring(0, 50) || 'media'}`);
  
  if (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup') {
    GROUP_ID = ctx.chat.id.toString();
  }
  
  return next();
});

// ==================== COMMANDES ====================

// /start
bot.command('start', (ctx) => {
  ctx.reply(`
🤖⚔️ *Obi-Code - Agent Développeur Senior*

*Mission:* Transformer CoachOS en SaaS monétisable 🚀

*Collaboration avec Kimi-Claw:*
🧠 Kimi = Architecture & Stratégie
🤖 Moi = Exécution & Monitoring

*Commandes disponibles:*
• /status - État du projet
• /deploy - Déployer sur Vercel
• /review - Analyser les PRs
• /issues - Voir les tâches
• /sprint - Objectifs du jour
• /kimi - Appeler Kimi-Claw
• /help - Aide complète

*Parle-moi naturellement !*
Je détecte quand il faut appeler Kimi.

"Ensemble, vers le SaaS nous irons."
  `, { parse_mode: 'Markdown' });
});

// /status - État global du projet
bot.command('status', async (ctx) => {
  try {
    ctx.reply('🔍 Analyse du projet CoachOS...');
    
    // Récupère les données
    const [{ data: repo }, { data: pulls }, { data: issues }] = await Promise.all([
      octokit.rest.repos.get({ owner: 'Gday82-oss', repo: 'CoachOs' }),
      octokit.rest.pulls.list({ owner: 'Gday82-oss', repo: 'CoachOs', state: 'open' }),
      octokit.rest.issues.listForRepo({ owner: 'Gday82-oss', repo: 'CoachOs', state: 'open' })
    ]);

    const message = `
📊 *CoachOS - État du Projet*

⭐ *Stars:* ${repo.stargazers_count}
🍴 *Forks:* ${repo.forks_count}
📦 *Taille:* ${repo.size} KB

🔀 *PRs ouvertes:* ${pulls.length}
📋 *Issues ouvertes:* ${issues.length}

🌐 *Production:* https://coach-os-khaki.vercel.app
📁 *Repo:* https://github.com/Gday82-oss/CoachOs

*Prochaine étape SaaS:*
Voir /sprint pour les objectifs
    `;

    ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (error) {
    ctx.reply('❌ Erreur de récupération des données.');
  }
});

// /sprint - Objectifs du jour/semaine
bot.command('sprint', (ctx) => {
  ctx.reply(`
🎯 *Objectifs CoachOS SaaS*

*Phase A - Architecture Scalable* 🔴
□ Multi-tenancy (isolation clients)
□ Rate limiting API
□ Cache Redis
□ Database pooling

*Phase B - Features IA* 🟡
□ Recommandations programmes
□ Analyse performance clients
□ Chatbot coach virtuel

*Phase C - Sécurité* 🔴
□ Auth complète (JWT + refresh)
□ Encryption données
□ RGPD compliance
□ Audit logs

*Phase D - Cloud* 🟡
□ Migration AWS/GCP
□ Auto-scaling
□ Backup automatisé
□ Monitoring avancé

*Priorité du jour:*
Demande à Kimi avec /kimi [sujet]
  `, { parse_mode: 'Markdown' });
});

// /kimi - Appeler Kimi-Claw
bot.command('kimi', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1).join(' ');
  
  if (!args) {
    return ctx.reply(`
🧠 *Appeler Kimi-Claw*

Usage: /kimi [sujet]

Exemples:
• /kimi Architecture multi-tenancy
• /kimi Comment scaler la BDD
• /kimi Sécurité auth JWT
• /kimi Pricing SaaS

Kimi interviendra ici ou dans la conversation principale.
    `, { parse_mode: 'Markdown' });
  }

  ctx.reply(getKimiEscalationMessage(args), { parse_mode: 'Markdown' });
  
  // Log pour Kimi
  logger.info(`🆘 ESCALADE KIMI: ${args}`);
});

// /deploy - Déployer
bot.command('deploy', async (ctx) => {
  try {
    ctx.reply('🚀 Lancement déploiement...');
    
    await octokit.rest.actions.createWorkflowDispatch({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      workflow_id: 'ci-cd.yml',
      ref: 'main'
    });

    ctx.reply(`
✅ *Déploiement lancé!*

📊 Suivi: https://github.com/Gday82-oss/CoachOs/actions
🌐 URL: https://coach-os-khaki.vercel.app

Je surveille et notifierai du résultat.
    `, { parse_mode: 'Markdown' });

  } catch (error) {
    ctx.reply('❌ Échec du lancement. Vérifier les permissions.');
  }
});

// /review - Analyser PRs
bot.command('review', async (ctx) => {
  const args = ctx.message.text.split(' ')[1];
  
  if (!args) {
    try {
      const { data: pulls } = await octokit.rest.pulls.list({
        owner: 'Gday82-oss',
        repo: 'CoachOs',
        state: 'open'
      });

      if (pulls.length === 0) {
        return ctx.reply('✨ Aucune PR ouverte! Code propre.');
      }

      let msg = '🔍 *PRs ouvertes:*\n\n';
      pulls.forEach((pr, i) => {
        msg += `${i+1}. #${pr.number} - ${pr.title}\n`;
        msg += `   👤 ${pr.user?.login || 'unknown'}\n\n`;
      });
      msg += 'Analyser: /review [numéro]';

      ctx.reply(msg, { parse_mode: 'Markdown' });

    } catch (error) {
      ctx.reply('❌ Erreur récupération PRs.');
    }
    return;
  }

  // Analyse détaillée
  try {
    ctx.reply(`🤖 Analyse PR #${args}...`);
    
    const pr = parseInt(args);
    const { data: pull } = await octokit.rest.pulls.get({
      owner: 'Gday82-oss', repo: 'CoachOs', pull_number: pr
    });
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: 'Gday82-oss', repo: 'CoachOs', pull_number: pr
    });

    const analysis = await obiCode.analyzePR(pull, files);
    ctx.reply(analysis, { parse_mode: 'Markdown' });

  } catch (error) {
    ctx.reply('❌ PR non trouvée.');
  }
});

// /issues - Voir les tâches
bot.command('issues', async (ctx) => {
  try {
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      state: 'open',
      per_page: 10
    });

    if (issues.length === 0) {
      return ctx.reply('✨ Pas d\'issues! Projet sain.');
    }

    let msg = '📋 *Issues à traiter:*\n\n';
    issues.forEach((issue, i) => {
      const labels = issue.labels.map((l: any) => `\`${l.name}\``).join(' ');
      msg += `${i+1}. #${issue.number} ${issue.title}\n`;
      if (labels) msg += `   ${labels}\n`;
    });

    ctx.reply(msg, { parse_mode: 'Markdown' });

  } catch (error) {
    ctx.reply('❌ Erreur récupération issues.');
  }
});

// /help
bot.command('help', (ctx) => {
  ctx.reply(`
🤖⚔️ *Obi-Code - Aide*

*Commandes Projet:*
/status - État global
/sprint - Objectifs SaaS
/deploy - Déployer

*Code Quality:*
/review - Analyser PRs
/review 42 - PR #42
/issues - Voir tâches

*Collaboration:*
/kimi [sujet] - Appeler Kimi-Claw

*Discute naturellement!*
Je détecte les sujets complexes.

"Vers le SaaS, ensemble."
  `, { parse_mode: 'Markdown' });
});

// ==================== CONVERSATION NATURELLE ====================

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return;

  // Détection escalation
  if (needsKimiEscalation(text)) {
    ctx.reply(getKimiEscalationMessage(text), { parse_mode: 'Markdown' });
    logger.info(`🆘 AUTO-ESCALADE: ${text}`);
    return;
  }

  // Réponse normale
  const response = await obiCode.chat(text);
  ctx.reply(response, { parse_mode: 'Markdown' });
});

// ==================== GESTION ERREURS ====================

bot.catch((err, ctx) => {
  logger.error('Erreur:', err);
  ctx.reply('🚨 Erreur. Réessayer ou appeler Kimi avec /kimi');
});

// ==================== DÉMARRAGE ====================

logger.info('🤖⚔️ Obi-Code SaaS démarre...');
logger.info('Collaboration Kimi-Claw activée');
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

logger.info('✅ Obi-Code prêt pour CoachOS SaaS!');
