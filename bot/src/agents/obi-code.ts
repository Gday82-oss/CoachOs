import { Octokit } from '@octokit/rest';
import axios from 'axios';
import type { PullRequest, PullRequestFile } from '../types/github';

// Base de connaissances du développeur senior
const BEST_PRACTICES = {
  react: [
    'Utiliser React.memo pour les composants qui re-rendent souvent',
    'Préférer useCallback pour les fonctions passées aux enfants',
    'Éviter les useEffect inutiles, privilégier la dérivation de state',
    'Utiliser des custom hooks pour la logique réutilisable'
  ],
  typescript: [
    'Jamais de any, toujours typer strictement',
    'Utiliser les unions discriminées pour les états',
    'Préférer interface over type pour les objets',
    'Utiliser satisfies pour la validation de type'
  ],
  performance: [
    'Lazy loading pour les routes et composants lourds',
    'Images optimisées (WebP, lazy loading)',
    'Éviter les re-renders inutiles',
    'Utiliser la pagination pour les grandes listes'
  ],
  security: [
    'Jamais de secrets en dur dans le code',
    'Validation des inputs côté serveur',
    'Protection XSS (échappement des données)',
    'CORS correctement configuré'
  ]
};

const JEDI_QUOTES = [
  'La Force est forte dans ce code, jeune padawan.',
  'Do or do not, there is no try.',
  'Un grand pouvoir implique de grandes responsabilités.',
  'Patience, tu dois avoir.',
  'Le code, ta meilleure arme est.',
  'Refactoriser, tu dois.',
  'Tests écrire, sûr être tu seras.',
  'Clean code, vers la lumière il te guidera.',
  'Bugs, les chasser nous devons.',
  'Optimiser, le chemin de la sagesse c\'est.'
];

export const obiCode = {
  // Analyse complète d'une PR
  async analyzePR(pull: PullRequest, files: PullRequestFile[]): Promise<string> {
    let analysis = `🤖 *Analyse Obi-Code*\n\n`;
    
    analysis += `📌 *${pull.title}*\n`;
    analysis += `👤 Par: ${pull.user?.login || 'unknown'}\n`;
    analysis += `📁 ${files.length} fichier(s) modifié(s)\n\n`;

    // Analyse détaillée
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const goodPractices: string[] = [];

    for (const file of files) {
      const fileAnalysis = this.analyzeFile(file);
      issues.push(...fileAnalysis.issues);
      warnings.push(...fileAnalysis.warnings);
      suggestions.push(...fileAnalysis.suggestions);
      goodPractices.push(...fileAnalysis.goodPractices);
    }

    // Score de qualité
    const score = this.calculateScore(issues, warnings, goodPractices, files.length);
    
    analysis += `⭐ *Score de qualité: ${score}/100*\n`;
    analysis += this.getScoreEmoji(score) + '\n\n';

    // Problèmes critiques
    if (issues.length > 0) {
      analysis += '🚨 *Problèmes critiques:*\n';
      issues.forEach(issue => analysis += `• ${issue}\n`);
      analysis += '\n';
    }

    // Avertissements
    if (warnings.length > 0) {
      analysis += '⚠️ *Attention:*\n';
      warnings.forEach(warning => analysis += `• ${warning}\n`);
      analysis += '\n';
    }

    // Suggestions
    if (suggestions.length > 0) {
      analysis += '💡 *Suggestions d\'amélioration:*\n';
      suggestions.forEach(sugg => analysis += `• ${sugg}\n`);
      analysis += '\n';
    }

    // Bonnes pratiques
    if (goodPractices.length > 0) {
      analysis += '✅ *Bonnes pratiques détectées:*\n';
      goodPractices.forEach(practice => analysis += `• ${practice}\n`);
      analysis += '\n';
    }

    // Conseil personnalisé
    analysis += this.getPersonalizedAdvice(score, issues, files);
    
    // Verdict
    analysis += `\n📊 *Verdict:* ${this.getVerdict(score)}\n\n`;
    analysis += `"${this.getQuote()}"`;

    return analysis;
  },

  // Analyse d'un fichier individuel
  analyzeFile(file: PullRequestFile): { issues: string[], warnings: string[], suggestions: string[], goodPractices: string[] } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const goodPractices: string[] = [];

    const patch = file.patch || '';
    const filename = file.filename;

    // Analyse TypeScript/React
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      // Problèmes critiques
      if (patch.includes('any')) {
        issues.push(`\`${filename}\`: Évite \`any\`, utilise des types stricts`);
      }
      if (patch.includes('console.log') && !filename.includes('.test.')) {
        warnings.push(`\`${filename}\`: Supprime les \`console.log\` avant merge`);
      }
      if (patch.includes('debugger')) {
        issues.push(`\`${filename}\`: Retire les breakpoints \`debugger\``);
      }
      if (patch.includes('eval(') || patch.includes('Function(')) {
        issues.push(`\`${filename}\`: \`eval\` est dangereux, évite-le`);
      }

      // Avertissements
      if (patch.includes('useEffect') && !patch.includes('[]')) {
        warnings.push(`\`${filename}\`: Vérifie les dépendances de useEffect`);
      }
      if (patch.includes('useState') && patch.includes('{}')) {
        suggestions.push(`\`${filename}\`: Type ton useState: \`useState<Type>({})\``);
      }
      if (patch.includes('async') && !patch.includes('try')) {
        warnings.push(`\`${filename}\`: Gère les erreurs avec try/catch`);
      }

      // Bonnes pratiques
      if (patch.includes('useMemo') || patch.includes('useCallback')) {
        goodPractices.push(`\`${filename}\`: Optimisation des performances détectée`);
      }
      if (patch.includes('try') && patch.includes('catch')) {
        goodPractices.push(`\`${filename}\`: Gestion d\'erreurs présente`);
      }
      if (patch.includes('interface') || patch.includes('type ')) {
        goodPractices.push(`\`${filename}\`: Typage strict utilisé`);
      }
    }

    // Analyse CSS/Tailwind
    if (filename.endsWith('.css') || filename.includes('.module.')) {
      if (patch.includes('!important')) {
        warnings.push(`\`${filename}\`: Évite \`!important\`, utilise la spécificité`);
      }
    }

    // Analyse taille
    if (file.changes > 500) {
      warnings.push(`\`${filename}\`: Fichier très gros (${file.changes} changements). Découper en plus petits modules ?`);
    }
    if (file.changes > 1000) {
      issues.push(`\`${filename}\`: Fichier trop gros ! Refactoring nécessaire`);
    }

    // Analyse sécurité
    if (patch.includes('password') || patch.includes('secret') || patch.includes('token')) {
      if (patch.includes('=') && (patch.includes('"') || patch.includes("'"))) {
        issues.push(`\`${filename}\`: Secret potentiellement exposé !`);
      }
    }

    // Suggestions React spécifiques
    if (filename.endsWith('.tsx')) {
      if (!patch.includes('React.memo') && file.changes > 200) {
        suggestions.push(`\`${filename}\`: Envisage React.memo pour les performances`);
      }
      if (patch.includes('props') && !patch.includes('interface') && !patch.includes('type ')) {
        suggestions.push(`\`${filename}\`: Définis une interface pour les props`);
      }
    }

    return { issues, warnings, suggestions, goodPractices };
  },

  // Calcul du score de qualité
  calculateScore(issues: string[], warnings: string[], goodPractices: string[], fileCount: number): number {
    let score = 100;
    
    // Pénalités
    score -= issues.length * 15;
    score -= warnings.length * 5;
    
    // Bonus
    score += goodPractices.length * 3;
    
    // Ajustement par fichier
    score = score - (fileCount * 2);
    
    // Limite
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  // Emoji selon le score
  getScoreEmoji(score: number): string {
    if (score >= 90) return '🌟 Excellent ! Code de maître Jedi';
    if (score >= 80) return '✅ Très bon. Quelques ajustements mineurs';
    if (score >= 70) return '👍 Correct. Améliorations possibles';
    if (score >= 60) return '⚠️ Passable. Refactoring recommandé';
    if (score >= 50) return '❌ Insuffisant. Changements nécessaires';
    return '🚨 Critique ! Retour à l\'école du code';
  },

  // Verdict final
  getVerdict(score: number): string {
    if (score >= 80) return '✅ *APPROUVÉ* - Prêt pour merge';
    if (score >= 60) return '⚠️ *CHANGEMENTS DEMANDÉS* - Corrections mineures';
    return '❌ *REFUSÉ* - Refactoring nécessaire';
  },

  // Conseil personnalisé
  getPersonalizedAdvice(score: number, issues: string[], files: PullRequestFile[]): string {
    let advice = '\n🎓 *Conseil du Maître:*\n';

    if (score < 60) {
      advice += 'Ton code a besoin de soin. Concentre-toi sur:\n';
      if (issues.some(i => i.includes('any'))) advice += '• Typer correctement avec TypeScript\n';
      if (issues.some(i => i.includes('secret'))) advice += '• Sécuriser les données sensibles\n';
      advice += '• Relire les fondamentaux React\n';
    } else if (score < 80) {
      advice += 'Bon travail ! Pour passer au niveau supérieur:\n';
      advice += `• ${BEST_PRACTICES.react[Math.floor(Math.random() * BEST_PRACTICES.react.length)]}\n`;
      advice += `• ${BEST_PRACTICES.typescript[Math.floor(Math.random() * BEST_PRACTICES.typescript.length)]}\n`;
    } else {
      advice += 'Excellent travail ! Tu maîtrises la Force du code.\n';
      advice += 'Continue sur cette voie, padawan deviendra maître.\n';
    }

    return advice;
  },

  // Citation aléatoire
  getQuote(): string {
    return JEDI_QUOTES[Math.floor(Math.random() * JEDI_QUOTES.length)];
  },

  // Réponse conversationnelle
  async chat(message: string): Promise<string> {
    const lowerMsg = message.toLowerCase();

    // Détection d'intention
    if (lowerMsg.includes('bug') || lowerMsg.includes('erreur')) {
      return `🐛 *Détection de bug*\n\n"Les bugs sont le chemin vers la sagesse. Montre-moi ton code, je t'aiderai à le résoudre."\n\nEnvoie-moi:\n• Le fichier concerné\n• Le message d'erreur\n• Ce que tu essaies de faire`;
    }

    if (lowerMsg.includes('deploy') || lowerMsg.includes('déploiement')) {
      return `🚀 *Déploiement*\n\nUtilise \`/obi deploy\` pour lancer un déploiement sur Vercel.\n\nJe vérifierai:\n• Que les tests passent\n• Que le build réussit\n• Que tout est prêt pour la production`;
    }

    if (lowerMsg.includes('review') || lowerMsg.includes('pr')) {
      return `🔍 *Code Review*\n\nUtilise \`/obi review\` pour voir les PRs ouvertes.\n\nJe vais analyser:\n• La qualité du code\n• Les potentiels bugs\n• Les performances\n• La sécurité`;
    }

    if (lowerMsg.includes('aide') || lowerMsg.includes('help')) {
      return `🤖 *Aide Obi-Code*\n\nJe suis ton développeur senior. Je peux:\n\n🔍 \`/obi review\` - Analyser les PRs\n🚀 \`/obi deploy\` - Déployer sur Vercel\n📊 \`/obi status\` - Voir les checks CI\n📋 \`/obi issues\` - Lister les issues\n➕ \`/obi create\` - Créer une issue\n\nOu discute avec moi naturellement !`;
    }

    // Réponse par défaut avec sagesse
    return `🤔 *Réflexion...*\n\n"${this.getQuote()}"\n\nPose-moi une question sur:\n• Le code (React, TypeScript, Node)\n• Le déploiement\n• Les bonnes pratiques\n• Un bug à résoudre\n\nJe suis là pour t'aider, jeune padawan.`;
  },

  // Veille technologique
  getTechNews(): string {
    const tips = [
      '💡 *Astuce React:* Utilise useId() pour les IDs uniques dans les formulaires',
      '⚡ *Performance:* Les Server Components réduisent le bundle client',
      '🔒 *Sécurité:* Valide toujours les inputs côté serveur',
      '🎨 *CSS:* Container queries sont maintenant supportés partout',
      '📦 *Bundle:* Analyse ton bundle avec @vercel/analytics'
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
};
