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

// Initialisation
const bot = new Telegraf(BOT_TOKEN);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Middleware de logging
bot.use((ctx, next) => {
  logger.info(`Commande reçue: ${ctx.message?.text} de ${ctx.from?.username}`);
  return next();
});

// ==================== COMMANDES OBI-CODE ====================

// Commande /start
bot.command('start', (ctx) => {
  ctx.reply(`
🤖 *Obi-Code est en ligne*

"La Force est forte dans ce code"

Commandes disponibles:
/obi review - Analyser une PR
/obi deploy - Déployer sur Vercel  
/obi status - Voir les checks CI
/obi issues - Lister les issues
/obi create [titre] - Créer une issue
/obi help - Aide complète

Prêt à coder, je suis.
  `, { parse_mode: 'Markdown' });
});

// Commande /obi review [PR_NUMBER]
bot.command('obi', async (ctx) => {
  const args = ctx.message.text.split(' ');
  const subCommand = args[1];
  const param = args[2];

  switch (subCommand) {
    case 'review':
      await handleReview(ctx, param);
      break;
    case 'deploy':
      await handleDeploy(ctx);
      break;
    case 'status':
      await handleStatus(ctx);
      break;
    case 'issues':
      await handleIssues(ctx);
      break;
    case 'create':
      await handleCreateIssue(ctx, args.slice(2).join(' '));
      break;
    case 'help':
    default:
      showHelp(ctx);
  }
});

// Analyser une PR
async function handleReview(ctx: Context, prNumber?: string) {
  try {
    if (!prNumber) {
      // Liste les PR ouvertes
      const { data: pulls } = await octokit.rest.pulls.list({
        owner: 'Gday82-oss',
        repo: 'CoachOs',
        state: 'open'
      });

      if (pulls.length === 0) {
        return ctx.reply('Aucune PR ouverte. Créer une branche, tu dois.');
      }

      let message = '🔍 *PRs ouvertes:*\n\n';
      pulls.forEach((pr, i) => {
        message += `${i + 1}. *#${pr.number}* - ${pr.title}\n`;
        message += `   👤 ${pr.user.login} | 📅 ${new Date(pr.created_at).toLocaleDateString()}\n\n`;
      });
      message += '\nPour analyser: `/obi review [NUMÉRO]`';

      return ctx.reply(message, { parse_mode: 'Markdown' });
    }

    // Analyse la PR spécifique
    const pr = parseInt(prNumber);
    ctx.reply(`🤖 Analyse de la PR #${pr} en cours...`);

    const { data: pull } = await octokit.rest.pulls.get({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      pull_number: pr
    });

    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      pull_number: pr
    });

    // Analyse Obi-Code
    const analysis = await obiCode.analyzePR(pull, files);

    ctx.reply(analysis, { parse_mode: 'Markdown' });

  } catch (error) {
    logger.error('Erreur review:', error);
    ctx.reply('🚨 Une erreur il y a eu. Vérifier le token, je dois.');
  }
}

// Déployer sur Vercel
async function handleDeploy(ctx: Context) {
  try {
    ctx.reply('🚀 Déploiement en cours...');

    // Trigger le workflow GitHub Actions
    await octokit.rest.actions.createWorkflowDispatch({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      workflow_id: 'ci-cd.yml',
      ref: 'main'
    });

    ctx.reply('✅ Déploiement lancé !\n\nVérifier le statut: https://github.com/Gday82-oss/CoachOs/actions');

  } catch (error) {
    logger.error('Erreur deploy:', error);
    ctx.reply('🚨 Échec du déploiement. Vérifier les secrets, tu dois.');
  }
}

// Voir le statut des checks
async function handleStatus(ctx: Context) {
  try {
    const { data: runs } = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      per_page: 5
    });

    let message = '📊 *Derniers workflows:*\n\n';
    
    runs.workflow_runs.forEach((run) => {
      const status = run.status === 'completed' 
        ? (run.conclusion === 'success' ? '✅' : '❌')
        : '🔄';
      
      message += `${status} *${run.name}*\n`;
      message += `   Branche: ${run.head_branch}\n`;
      message += `   Date: ${new Date(run.created_at).toLocaleString()}\n\n`;
    });

    ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (error) {
    logger.error('Erreur status:', error);
    ctx.reply('🚨 Impossible de récupérer le statut.');
  }
}

// Lister les issues
async function handleIssues(ctx: Context) {
  try {
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      state: 'open',
      per_page: 10
    });

    if (issues.length === 0) {
      return ctx.reply('✨ Aucune issue ouverte. Propre, le code est.');
    }

    let message = '📋 *Issues ouvertes:*\n\n';
    
    issues.forEach((issue, i) => {
      const labels = issue.labels.map((l: any) => l.name).join(', ');
      message += `${i + 1}. *#${issue.number}* - ${issue.title}\n`;
      if (labels) message += `   🏷️ ${labels}\n`;
      message += `   👤 ${issue.user?.login}\n\n`;
    });

    ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (error) {
    logger.error('Erreur issues:', error);
    ctx.reply('🚨 Impossible de lister les issues.');
  }
}

// Créer une issue
async function handleCreateIssue(ctx: Context, title?: string) {
  if (!title) {
    return ctx.reply('❌ Titre manquant.\n\nUsage: `/obi create Titre de l\'issue`', { parse_mode: 'Markdown' });
  }

  try {
    const { data: issue } = await octokit.rest.issues.create({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      title: title,
      body: `Issue créée via Obi-Code Bot 🤖\n\nPar: ${ctx.from?.username}`
    });

    ctx.reply(`✅ Issue créée !\n\n*#${issue.number}* - ${issue.title}\n\n${issue.html_url}`, { parse_mode: 'Markdown' });

  } catch (error) {
    logger.error('Erreur create issue:', error);
    ctx.reply('🚨 Impossible de créer l\'issue.');
  }
}

// Aide
function showHelp(ctx: Context) {
  ctx.reply(`
🤖 *Obi-Code - Aide*

*Commandes disponibles:*

🔍 \`/obi review\` - Liste les PRs ouvertes
🔍 \`/obi review 42\` - Analyse la PR #42

🚀 \`/obi deploy\` - Déploie sur Vercel

📊 \`/obi status\` - Voir les checks CI/CD

📋 \`/obi issues\` - Lister les issues

➕ \`/obi create Titre\` - Créer une issue

❓ \`/obi help\` - Cette aide

"Que la Force du code soit avec toi."
  `, { parse_mode: 'Markdown' });
}

// Gestion des erreurs
bot.catch((err, ctx) => {
  logger.error('Erreur bot:', err);
  ctx.reply('🚨 Une erreur il y a eu. Réessayer, tu dois.');
});

// Démarrage
logger.info('🤖 Obi-Code démarre...');
bot.launch();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

logger.info('✅ Obi-Code est en ligne !');
