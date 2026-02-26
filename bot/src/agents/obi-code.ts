import type { PullRequest, PullRequestFile } from '../types/github';

export const obiCode = {
  async analyzePR(pull: PullRequest, files: PullRequestFile[]): Promise<string> {
    let analysis = `🤖 *Analyse Obi-Code de la PR #${pull.number}*\n\n`;
    
    analysis += `📌 *Titre:* ${pull.title}\n`;
    analysis += `👤 *Auteur:* ${pull.user.login}\n`;
    analysis += `📁 *Fichiers modifiés:* ${files.length}\n\n`;

    // Analyse des fichiers
    let issues: string[] = [];
    let warnings: string[] = [];
    let goodPractices: string[] = [];

    for (const file of files) {
      // Vérification TypeScript
      if (file.filename.endsWith('.ts') || file.filename.endsWith('.tsx')) {
        if (file.patch?.includes('any')) {
          issues.push(`🚨 \`${file.filename}\` - Évite \`any\`, utilise des types stricts`);
        }
        if (file.patch?.includes('console.log')) {
          warnings.push(`⚠️ \`${file.filename}\` - Supprime les \`console.log\``);
        }
        if (file.patch?.includes('useEffect') && !file.patch.includes('dependency')) {
          warnings.push(`⚠️ \`${file.filename}\` - Vérifie les dépendances de useEffect`);
        }
      }

      // Vérification taille
      if (file.changes > 500) {
        warnings.push(`⚠️ \`${file.filename}\` - Fichier très gros (${file.changes} changements). Découper, tu devrais.`);
      }

      // Bonnes pratiques
      if (file.patch?.includes('try') && file.patch?.includes('catch')) {
        goodPractices.push(`✅ \`${file.filename}\` - Bonne gestion d'erreurs`);
      }
    }

    // Résumé
    if (issues.length > 0) {
      analysis += '🚨 *Problèmes critiques:*\n' + issues.join('\n') + '\n\n';
    }
    
    if (warnings.length > 0) {
      analysis += '⚠️ *Attention:*\n' + warnings.join('\n') + '\n\n';
    }
    
    if (goodPractices.length > 0) {
      analysis += '✅ *Bonnes pratiques:*\n' + goodPractices.join('\n') + '\n\n';
    }

    if (issues.length === 0 && warnings.length === 0) {
      analysis += '✨ *Code propre !* Aucun problème détecté.\n\n';
    }

    analysis += `📊 *Verdict:* ${issues.length === 0 ? '✅ Approuvé' : '❌ Changements demandés'}\n\n`;
    analysis += `"${this.getQuote()}"`;

    return analysis;
  },

  getQuote(): string {
    const quotes = [
      'La Force est forte dans ce code.',
      'Do or do not, there is no try.',
      'Un grand pouvoir implique de grandes responsabilités.',
      'Patience, jeune padawan.',
      'Le code, ta meilleure arme est.',
      'Refactoriser, tu dois.',
      'Tests écrire, sûr être tu seras.'
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
};
