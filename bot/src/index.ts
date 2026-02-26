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

// ID du groupe (à récupérer dynamiquement)
let GROUP_ID: string | undefined;

// Initialisation
const bot = new Telegraf(BOT_TOKEN);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Middleware de logging
bot.use((ctx, next) => {
  logger.info(`Message reçu de ${ctx.from?.username} dans ${ctx.chat?.type}`);
  
  // Sauvegarde l'ID du groupe si c'est un groupe
  if (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup') {
    GROUP_ID = ctx.chat.id.toString();
    logger.info(`Groupe enregistré: ${GROUP_ID}`);
  }
  
  return next();
});

// Commande /start
bot.command('start', (ctx) => {
  const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
  
  if (isGroup) {
    ctx.reply(`
🤖 *Obi-Code est en ligne dans ce groupe*

"La Force est forte dans ce code"

Commandes disponibles:
• /obi status - Voir les checks CI/CD
• /obi review - Analyser les PRs  
• /obi deploy - Déployer sur Vercel
• /obi issues - Lister les issues
• /obi help - Aide complète

Prêt à coder, je suis.
    `, { parse_mode: 'Markdown' });
  } else {
    ctx.reply(`
🤖 *Obi-Code*

Ajoute-moi à ton groupe de développement:
${GROUP_LINK}

Ou utilise les commandes en privé.
    `, { parse_mode: 'Markdown' });
  }
});

// Commande /obi avec sous-commandes
bot.command('obi', async (ctx) => {
  const args = ctx.message.text.split(' ');
  const subCommand = args[1];
  const param = args[2];

  switch (subCommand) {
    case 'status':
      await handleStatus(ctx);
      break;
    case 'review':
      await handleReview(ctx, param);
      break;
    case 'deploy':
      await handleDeploy(ctx);
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

// Voir le statut des workflows
async function handleStatus(ctx: Context) {
  try {
    // Message de chargement
    const loadingMsg = await ctx.reply('🔍 Analyse des workflows en cours...');
    
    const { data: runs } = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      per_page: 5
    });

    let message = '📊 *Statut des workflows*\n\n';
    
    runs.workflow_runs.forEach((run) => {
      const icon = run.status === 'completed' 
        ? (run.conclusion === 'success' ? '✅' : '❌')
        : '🔄';
      
      message += `${icon} *${run.name}*\n`;
      message += `   Branche: \`${run.head_branch}\`\n`;
      message += `   Date: ${new Date(run.created_at).toLocaleString('fr-FR')}\n\n`;
    });

    // Supprime le message de chargement
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
    
    await ctx.reply(message, { parse_mode: 'Markdown' });

  } catch (error) {
    logger.error('Erreur status:', error);
    ctx.reply('🚨 Impossible de récupérer le statut. Vérifie la configuration GitHub.');
  }
}

// Analyser une PR
async function handleReview(ctx: Context, prNumber?: string) {
  try {
    if (!prNumber) {
      // Liste les PR ouvertes
      const loadingMsg = await ctx.reply('🔍 Recherche des PRs ouvertes...');
      
      const { data: pulls } = await octokit.rest.pulls.list({
        owner: 'Gday82-oss',
        repo: 'CoachOs',
        state: 'open'
      });

      await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

      if (pulls.length === 0) {
        return ctx.reply('✨ Aucune PR ouverte. Le code est propre !');
      }

      let message = '🔍 *Pull Requests ouvertes*\n\n';
      pulls.forEach((pr, i) => {
        message += `${i + 1}. *#${pr.number}* - ${pr.title}\n`;
        message += `   👤 ${pr.user.login}\n`;
        message += `   📅 ${new Date(pr.created_at).toLocaleDateString('fr-FR')}\n\n`;
      });
      message += 'Pour analyser: `/obi review [NUMÉRO]`';

      return ctx.reply(message, { parse_mode: 'Markdown' });
    }

    // Analyse la PR spécifique
    const loadingMsg = await ctx.reply(`🤖 Analyse de la PR #${prNumber}...`);

    const pr = parseInt(prNumber);
    
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

    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    // Analyse Obi-Code
    const analysis = await obiCode.analyzePR(pull, files);

    await ctx.reply(analysis, { parse_mode: 'Markdown' });

  } catch (error) {
    logger.error('Erreur review:', error);
    ctx.reply('🚨 PR non trouvée ou erreur d\'accès.');
  }
}

// Déployer sur Vercel
async function handleDeploy(ctx: Context) {
  try {
    const loadingMsg = await ctx.reply('🚀 Lancement du déploiement...');

    // Trigger le workflow GitHub Actions
    await octokit.rest.actions.createWorkflowDispatch({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      workflow_id: 'ci-cd.yml',
      ref: 'main'
    });

    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    await ctx.reply(`
✅ *Déploiement lancé !*

🚀 Production en cours...
📊 Suivre: https://github.com/Gday82-oss/CoachOs/actions
🌐 URL: https://coach-os-khaki.vercel.app/

"Patience, jeune padawan."
    `, { parse_mode: 'Markdown' });

  } catch (error) {
    logger.error('Erreur deploy:', error);
    ctx.reply('🚨 Échec du déploiement. Vérifie les permissions GitHub.');
  }
}

// Lister les issues
async function handleIssues(ctx: Context) {
  try {
    const loadingMsg = await ctx.reply('📋 Recherche des issues...');

    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      state: 'open',
      per_page: 10
    });

    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    if (issues.length === 0) {
      return ctx.reply('✨ Aucune issue ouverte. Propre, le code est !');
    }

    let message = '📋 *Issues ouvertes*\n\n';
    
    issues.forEach((issue, i) => {
      const labels = issue.labels.map((l: any) => `\`${l.name}\``).join(' ');
      message += `${i + 1}. *#${issue.number}* - ${issue.title}\n`;
      if (labels) message += `   🏷️ ${labels}\n`;
      message += `   👤 ${issue.user?.login}\n\n`;
    });

    await ctx.reply(message, { parse_mode: 'Markdown' });

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
    const loadingMsg = await ctx.reply('➕ Création de l\'issue...');

    const { data: issue } = await octokit.rest.issues.create({
      owner: 'Gday82-oss',
      repo: 'CoachOs',
      title: title,
      body: `Issue créée via Obi-Code Bot 🤖\n\nPar: ${ctx.from?.username || 'unknown'}`,
      labels: ['bot-created']
    });

    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);

    await ctx.reply(`
✅ *Issue créée !*

*#${issue.number}* - ${issue.title}

${issue.html_url}
    `, { parse_mode: 'Markdown' });

  } catch (error) {
    logger.error('Erreur create issue:', error);
    ctx.reply('🚨 Impossible de créer l\'issue.');
  }
}

// Aide
function showHelp(ctx: Context) {
  ctx.reply(`
🤖 *Obi-Code - Commandes disponibles*

🔍 *Analyse*
• \`/obi review\` - Lister les PRs
• \`/obi review 42\` - Analyser la PR #42

🚀 *Déploiement*
• \`/obi deploy\` - Déployer sur Vercel

📊 *Monitoring*
• \`/obi status\` - Voir les checks CI/CD
• \`/obi issues\` - Lister les issues

➕ *Gestion*
• \`/obi create Titre\` - Créer une issue

❓ *Aide*
• \`/obi help\` - Cette aide

"Que la Force du code soit avec toi."
  `, { parse_mode: 'Markdown' });
}

// Notifications automatiques
export async function notifyDeployment(status: 'success' | 'failure', url?: string) {
  if (!GROUP_ID) {
    logger.warn('Groupe non configuré pour les notifications');
    return;
  }

  const icon = status === 'success' ? '✅' : '❌';
  const message = status === 'success' 
    ? `${icon} *Déploiement réussi !*\n\n🌐 ${url || 'Site mis à jour'}`
    : `${icon} *Déploiement échoué*\n\nVérifier les logs: https://github.com/Gday82-oss/CoachOs/actions`;

  try {
    await bot.telegram.sendMessage(GROUP_ID, message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Erreur notification:', error);
  }
}

// Gestion des erreurs
bot.catch((err, ctx) => {
  logger.error('Erreur bot:', err);
  ctx.reply('🚨 Une erreur il y a eu. Réessayer, tu dois.');
});

// Démarrage
logger.info('🤖 Obi-Code démarre...');
logger.info(`Groupe configuré: ${GROUP_LINK}`);

bot.launch();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

logger.info('✅ Obi-Code est en ligne !');
