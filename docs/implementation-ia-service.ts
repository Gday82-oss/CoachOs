import Anthropic from '@anthropic-ai/sdk';
import { PROGRAMME_GENERATOR_SYSTEM } from '../prompts/programmeGenerator';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ProgrammeGenerationRequest {
  objectif: 'perte_poids' | 'prise_masse' | 'tonification' | 'endurance' | 'force' | 'sante';
  niveau: 'debutant' | 'intermediaire' | 'avance';
  duree_semaines: number;
  frequence_semaine: number;
  equipement: string[];
  contraintes?: string;
  age?: number;
  sexe?: 'homme' | 'femme';
}

export async function generateProgramme(request: ProgrammeGenerationRequest) {
  const prompt = buildPrompt(request);
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4000,
    temperature: 0.7,
    system: PROGRAMME_GENERATOR_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  // Parsing et validation du JSON
  const content = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
    
  try {
    // Extraction JSON si encadré par ```json
    const jsonMatch = content.match(/```json\n?([\s\S]*?)```/) || 
                      content.match(/```\n?([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Erreur parsing IA:', error);
    throw new Error('Réponse IA invalide');
  }
}

function buildPrompt(request: ProgrammeGenerationRequest): string {
  return `Crée un programme personnalisé avec les paramètres suivants:

PROFIL:
- Objectif: ${request.objectif}
- Niveau: ${request.niveau}
- Durée: ${request.duree_semaines} semaines
- Fréquence: ${request.frequence_semaine} séances par semaine
- Équipement disponible: ${request.equipement.join(', ')}
${request.contraintes ? `- Contraintes médicales: ${request.contraintes}` : ''}
${request.age ? `- Âge: ${request.age} ans` : ''}

INSTRUCTIONS:
1. Crée ${request.frequence_semaine} séances distinctes par semaine
2. Varie les exercices d'une semaine à l'autre
3. Respecte STRICTEMENT les contraintes physiques
4. Inclus échauffement (5 min) et retour au calme (5 min)
5. Pour chaque exercice, donne 2 alternatives si possible

Réponds UNIQUEMENT en JSON valide.`;
}
