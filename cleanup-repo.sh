#!/usr/bin/env bash
# ============================================================
# cleanup-repo.sh — Nettoyage du dépôt Git MyCareCoach
# ============================================================
# Ce script nettoie le dépôt en 3 phases :
#   1. Retirer les fichiers node_modules encore trackés
#   2. Nettoyer l'historique Git (avec git-filter-repo)
#   3. Rapport final
# ============================================================
set -euo pipefail

# --- Couleurs pour l'affichage ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERR]${NC}  $1"; }
log_section() { echo -e "\n${BOLD}════════════════════════════════════════${NC}"; echo -e "${BOLD} $1${NC}"; echo -e "${BOLD}════════════════════════════════════════${NC}"; }

# Vérifier qu'on est bien à la racine du dépôt
if [ ! -f ".gitignore" ] || [ ! -d ".git" ]; then
  log_error "Lancez ce script depuis la racine du dépôt MyCareCoach"
  exit 1
fi

REPO_ROOT=$(pwd)

# ─────────────────────────────────────────────────────────────
log_section "PHASE 0 : État initial"
# ─────────────────────────────────────────────────────────────
SIZE_INITIAL=$(du -sh . --exclude='.git' 2>/dev/null | cut -f1)
SIZE_GIT_INITIAL=$(du -sh .git 2>/dev/null | cut -f1)
TRACKED_NM=$(git ls-files | grep "node_modules" | wc -l)

echo ""
echo "  Taille dépôt (hors .git) : ${SIZE_INITIAL}"
echo "  Taille historique (.git)  : ${SIZE_GIT_INITIAL}"
echo "  Fichiers node_modules trackés : ${TRACKED_NM}"
echo ""

log_warn "ATTENTION : Ce script va réécrire l'historique Git."
log_warn "Cela signifie que toute personne ayant cloné le dépôt devra"
log_warn "faire un 'git pull --rebase' ou re-cloner."
echo ""
read -rp "  Continuer ? (oui/non) : " CONFIRM
if [[ "$CONFIRM" != "oui" ]]; then
  echo "Annulé."
  exit 0
fi

# ─────────────────────────────────────────────────────────────
log_section "PHASE 1 : Retrait des fichiers trackés indésirables"
# ─────────────────────────────────────────────────────────────

# 1a. Retirer les node_modules/.bin encore trackés
NM_FILES=$(git ls-files | grep "node_modules")
if [ -n "$NM_FILES" ]; then
  log_info "Suppression du cache git pour node_modules..."
  git rm --cached -r --quiet client/node_modules/ 2>/dev/null || true
  git rm --cached -r --quiet server/node_modules/ 2>/dev/null || true
  git rm --cached -r --quiet node_modules/ 2>/dev/null || true
  log_ok "node_modules retiré du tracking Git"
else
  log_ok "Aucun node_modules tracké (déjà propre)"
fi

# 1b. Vérifier que .gitignore couvre bien tout
log_info "Vérification du .gitignore..."
GITIGNORE_OK=true

check_ignore() {
  local pattern="$1"
  if ! grep -q "$pattern" .gitignore 2>/dev/null; then
    log_warn ".gitignore manque : $pattern"
    GITIGNORE_OK=false
  fi
}

check_ignore "node_modules"
check_ignore "\*.deb"
check_ignore "\*.m4a"
check_ignore "\*.tar.gz"
check_ignore "dist/"

if [ "$GITIGNORE_OK" = true ]; then
  log_ok ".gitignore est complet"
fi

# 1c. Commit si des fichiers ont été retirés
if ! git diff --cached --quiet 2>/dev/null; then
  log_info "Création d'un commit de nettoyage..."
  git commit -m "chore: retirer node_modules du tracking Git

Les node_modules ne doivent pas être versionnés.
Ils sont déjà dans .gitignore mais avaient été
accidentellement committés dans l'historique."
  log_ok "Commit de nettoyage créé"
else
  log_ok "Aucun changement à commiter"
fi

# ─────────────────────────────────────────────────────────────
log_section "PHASE 2 : Nettoyage de l'historique Git"
# ─────────────────────────────────────────────────────────────

# Vérifier si git-filter-repo est dispo
if ! command -v git-filter-repo &>/dev/null; then
  log_warn "git-filter-repo n'est pas installé."
  echo ""
  echo "  Pour installer :"
  echo "  ${YELLOW}pip3 install git-filter-repo${NC}"
  echo "  ou"
  echo "  ${YELLOW}sudo apt install git-filter-repo${NC}"
  echo ""
  read -rp "  Voulez-vous installer git-filter-repo maintenant ? (oui/non) : " INSTALL_GFR
  if [[ "$INSTALL_GFR" == "oui" ]]; then
    if command -v pip3 &>/dev/null; then
      pip3 install git-filter-repo --quiet
      log_ok "git-filter-repo installé"
    else
      log_error "pip3 non trouvé. Installez manuellement puis relancez le script."
      exit 1
    fi
  else
    log_warn "Nettoyage de l'historique ignoré. Taille .git inchangée."
    SKIP_HISTORY=true
  fi
fi

SKIP_HISTORY=${SKIP_HISTORY:-false}

if [ "$SKIP_HISTORY" = false ]; then
  log_warn "Réécriture de l'historique pour supprimer node_modules de TOUS les commits..."
  echo ""
  read -rp "  Cette opération est irréversible. Confirmer ? (oui/non) : " CONFIRM2
  if [[ "$CONFIRM2" != "oui" ]]; then
    log_warn "Réécriture de l'historique ignorée."
    SKIP_HISTORY=true
  fi
fi

if [ "$SKIP_HISTORY" = false ]; then
  log_info "Lancement de git-filter-repo..."

  # Supprimer node_modules de tout l'historique
  git filter-repo \
    --path client/node_modules --invert-paths \
    --path server/node_modules --invert-paths \
    --path node_modules --invert-paths \
    --force \
    --quiet

  # Nettoyage agressif des objets orphelins
  log_info "Nettoyage des objets Git orphelins..."
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive --quiet

  log_ok "Historique nettoyé"
else
  log_info "Nettoyage partiel sans réécriture d'historique..."
  git gc --quiet
  log_ok "GC Git exécuté (gains limités sans réécriture)"
fi

# ─────────────────────────────────────────────────────────────
log_section "PHASE 3 : Fichiers locaux lourds (non commités)"
# ─────────────────────────────────────────────────────────────

echo ""
log_info "Ces fichiers sont LOCAUX (non dans Git) mais occupent de l'espace disque :"
echo ""

LARGE_LOCAL_FILES=(
  "code_1.110.0-1772587980_amd64.deb"
  "Voix 260305_183952.m4a"
  "supabase_linux_amd64.tar.gz"
)

FOUND_LARGE=false
for f in "${LARGE_LOCAL_FILES[@]}"; do
  if [ -f "$f" ]; then
    SIZE=$(du -sh "$f" | cut -f1)
    echo "  ${YELLOW}${SIZE}${NC}  $f"
    FOUND_LARGE=true
  fi
done

if [ "$FOUND_LARGE" = false ]; then
  log_ok "Aucun gros fichier local détecté"
fi

echo ""
log_warn "Ces fichiers sont déjà dans .gitignore (ne seront jamais commités)."
read -rp "  Voulez-vous les supprimer localement pour libérer de l'espace ? (oui/non) : " DEL_LOCAL
if [[ "$DEL_LOCAL" == "oui" ]]; then
  for f in "${LARGE_LOCAL_FILES[@]}"; do
    if [ -f "$f" ]; then
      rm "$f"
      log_ok "Supprimé : $f"
    fi
  done
else
  log_info "Fichiers locaux conservés."
fi

# ─────────────────────────────────────────────────────────────
log_section "PHASE 4 : Push vers GitHub"
# ─────────────────────────────────────────────────────────────

REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE" ]; then
  log_warn "Aucun remote 'origin' configuré. Push ignoré."
else
  echo ""
  log_info "Remote détecté : ${REMOTE}"
  echo ""
  if [ "$SKIP_HISTORY" = false ]; then
    log_warn "L'historique a été réécrit. Il faut forcer le push."
    log_warn "Cela écrasera l'historique sur GitHub !"
    echo ""
    read -rp "  Forcer le push (git push --force) ? (oui/non) : " DO_PUSH
    if [[ "$DO_PUSH" == "oui" ]]; then
      git push --force origin main
      log_ok "Push forcé effectué"
    else
      log_warn "Push ignoré. Faites-le manuellement quand vous êtes prêt :"
      echo "  ${YELLOW}git push --force origin main${NC}"
    fi
  else
    read -rp "  Push normal ? (oui/non) : " DO_PUSH
    if [[ "$DO_PUSH" == "oui" ]]; then
      git push origin main
      log_ok "Push effectué"
    fi
  fi
fi

# ─────────────────────────────────────────────────────────────
log_section "RAPPORT FINAL"
# ─────────────────────────────────────────────────────────────

SIZE_FINAL=$(du -sh . --exclude='.git' 2>/dev/null | cut -f1)
SIZE_GIT_FINAL=$(du -sh .git 2>/dev/null | cut -f1)

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │           BILAN DU NETTOYAGE             │"
echo "  ├─────────────────────────────────────────┤"
printf  "  │  Taille .git avant  : %8s              │\n" "$SIZE_GIT_INITIAL"
printf  "  │  Taille .git après  : %8s              │\n" "$SIZE_GIT_FINAL"
echo "  ├─────────────────────────────────────────┤"
echo "  │  Recommandations futures :               │"
echo "  │  • Vérifier : git check-ignore <fichier> │"
echo "  │  • Ne jamais faire : git add .           │"
echo "  │  • Toujours faire  : git add -p          │"
echo "  └─────────────────────────────────────────┘"
echo ""
log_ok "Nettoyage terminé !"
echo ""
echo -e "  Pour connecter ce dépôt à Claude :"
echo -e "  ${BLUE}https://claude.ai → Projets → Ajouter un dépôt GitHub${NC}"
echo ""
