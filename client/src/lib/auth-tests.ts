/**
 * TESTS D'AUTHENTIFICATION MyCareCoach
 * 
 * Ce fichier documente les scénarios de test pour l'authentification
 * et les corrections apportées.
 */

// ============================================
// CORRECTIONS APPORTÉES
// ============================================

/**
 * 1. UNIFICATION DES TABLES
 * -------------------------
 * PROBLÈME : Le code utilisait 'clients_coach' mais le schéma SQL ne définissait que 'clients'
 * SOLUTION : 
 *   - Uniformisation sur la table 'clients' partout
 *   - Création d'une vue 'clients_coach' pour compatibilité si besoin
 *   - Mise à jour de tous les fichiers : Dashboard, Clients, Seances, Programmes, Metriques, Attestations
 */

/**
 * 2. POLITIQUES RLS POUR CLIENTS
 * ------------------------------
 * PROBLÈME : Les clients ne pouvaient pas accéder à leurs données (erreur 403)
 * SOLUTION :
 *   - Ajout de politiques SELECT pour les clients sur toutes les tables :
 *     * clients : voir leur profil par email
 *     * seances : voir leurs séances
 *     * programmes : voir leurs programmes
 *     * metriques : voir leurs métriques
 */

/**
 * 3. GESTION DES ERREURS
 * ----------------------
 * PROBLÈME : Les erreurs Supabase n'étaient pas gérées (crash sur .single() sans résultat)
 * SOLUTION :
 *   - Remplacement de .single() par .maybeSingle() dans App.tsx
 *   - Ajout de vérifications d'erreurs dans ClientPortal.tsx
 *   - Vérification de user?.email avant requête
 */

/**
 * 4. TRIGGER DE CRÉATION DE PROFIL
 * ---------------------------------
 * AJOUT : Fonction handle_new_user() qui crée automatiquement un profil coach
 *         quand un nouvel utilisateur s'inscrit via auth.users
 */

// ============================================
// SCÉNARIOS DE TEST
// ============================================

const TEST_SCENARIOS = {
  // Test 1 : Inscription Coach
  test1_inscription_coach: {
    etapes: [
      "Aller sur /auth",
      "Cliquer 'Créer un compte'",
      "Remplir nom, prénom, email, mot de passe",
      "Soumettre le formulaire"
    ],
    resultat_attendu: "Compte créé, profil coach créé automatiquement, redirection vers /",
    verification_sql: "SELECT * FROM coachs WHERE email = 'test@example.com';"
  },

  // Test 2 : Connexion Coach
  test2_connexion_coach: {
    etapes: [
      "Aller sur /auth",
      "Remplir email et mot de passe du coach",
      "Cliquer 'Se connecter'"
    ],
    resultat_attendu: "Connexion réussie, affichage du CoachApp (dashboard coach)",
    verification: "Vérifier que la sidebar affiche 'Dashboard', 'Clients', 'Séances'..."
  },

  // Test 3 : Création d'un client par le coach
  test3_creation_client: {
    etapes: [
      "Se connecter en tant que coach",
      "Aller dans 'Clients'",
      "Cliquer 'Nouveau client'",
      "Remplir les infos (nom, prénom, email)",
      "Créer"
    ],
    resultat_attendu: "Client créé dans la table clients avec coach_id",
    verification_sql: "SELECT * FROM clients WHERE email = 'client@test.com';"
  },

  // Test 4 : Connexion Client (espace client)
  test4_connexion_client: {
    pre_requis: "Un client doit exister avec un email correspondant à un compte auth",
    etapes: [
      "Créer un compte auth avec l'email du client (ou utiliser un compte existant)",
      "Se connecter avec cet email"
    ],
    resultat_attendu: "Redirection vers l'espace client (ClientPortal)",
    verification: "Vérifier que la sidebar affiche 'Mon espace', 'Mes séances'..."
  },

  // Test 5 : Accès client à ses données
  test5_acces_donnees_client: {
    pre_requis: "Être connecté en tant que client",
    etapes: [
      "Aller dans 'Mes séances'",
      "Aller dans 'Mes programmes'",
      "Aller dans 'Mes métriques'"
    ],
    resultat_attendu: "Les données du client s'affichent sans erreur 403",
    verification: "Vérifier dans la console qu'il n'y a pas d'erreur RLS"
  },

  // Test 6 : Mot de passe oublié
  test6_mot_de_passe_oublie: {
    etapes: [
      "Aller sur /auth",
      "Cliquer 'Mot de passe oublié ?'",
      "Entrer l'email",
      "Cliquer 'Envoyer'"
    ],
    resultat_attendu: "Email envoyé avec lien de réinitialisation",
    verification: "Vérifier dans Supabase Auth > Emails"
  },

  // Test 7 : Déconnexion
  test7_deconnexion: {
    etapes: [
      "Être connecté",
      "Cliquer sur 'Déconnexion' dans la sidebar"
    ],
    resultat_attendu: "Redirection vers /auth, session supprimée",
    verification: "localStorage clear, cookies supprimés"
  }
};

// ============================================
// COMMANDES SQL DE VÉRIFICATION
// ============================================

const SQL_VERIFICATION = `
-- Vérifier les coachs
SELECT id, email, nom, prenom FROM coachs;

-- Vérifier les clients avec leur coach
SELECT c.id, c.email, c.nom, c.prenom, 
       coach.nom as coach_nom, coach.prenom as coach_prenom
FROM clients c
JOIN coachs coach ON c.coach_id = coach.id;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('clients', 'seances', 'programmes', 'metriques');

-- Vérifier les utilisateurs auth
SELECT id, email, email_confirmed_at, last_sign_in_at
FROM auth.users;
`;

export { TEST_SCENARIOS, SQL_VERIFICATION };
