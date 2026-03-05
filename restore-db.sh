#!/bin/bash
# =============================================================================
# MyCareCoach — Restauration de la base de données depuis un backup
# =============================================================================
# Usage : ./restore-db.sh /var/backups/mycarecoach/backup_YYYY-MM-DD_HH-MM.sql.gz
#
# ATTENTION : ce script ECRASE toutes les donnees actuelles de la base !
#             Faites un backup manuel avant de lancer une restauration.
#
# Etapes d'urgence :
#   1. Lister les backups disponibles :
#        ls -lh /var/backups/mycarecoach/
#   2. Restaurer le backup voulu :
#        /home/deploy/restore-db.sh /var/backups/mycarecoach/backup_2024-01-15_03-00.sql.gz
#   3. Confirmer en tapant "RESTAURER" quand le script le demande
#   4. Vérifier que https://mycarecoach.app fonctionne
# =============================================================================
set -euo pipefail

ENV_FILE="/etc/mycarecoach-backup.env"

# Couleurs
RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' NC='\033[0m'
log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[ATTENTION]${NC} $1"; }
err()  { echo -e "${RED}[ERREUR]${NC} $1" >&2; }

# ── Vérifier l'argument ───────────────────────────────────────────────────────
if [ -z "${1:-}" ]; then
    err "Usage : $0 <fichier_backup.sql.gz>"
    echo ""
    echo "Backups disponibles :"
    find /var/backups/mycarecoach -name "backup_*.sql.gz" 2>/dev/null \
        | sort -r \
        | while read -r f; do echo "  $f ($(du -sh "$f" | cut -f1))"; done \
        || echo "  Aucun backup trouve."
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    err "Fichier introuvable : $BACKUP_FILE"
    exit 1
fi

if [[ "$BACKUP_FILE" != *.sql.gz ]]; then
    err "Le fichier doit avoir l'extension .sql.gz"
    exit 1
fi

# ── Charger les credentials ───────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    err "Fichier de configuration introuvable : $ENV_FILE"
    exit 1
fi
# shellcheck source=/dev/null
source "$ENV_FILE"
export PGPASSWORD PGHOST PGPORT PGUSER PGDATABASE

# ── Confirmation manuelle ─────────────────────────────────────────────────────
TAILLE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo ""
warn "Vous allez restaurer : $BACKUP_FILE (${TAILLE})"
warn "Cela va ECRASER toutes les donnees actuelles de la base !"
echo ""
echo -n "Tapez exactement 'RESTAURER' pour confirmer : "
read -r CONFIRM

if [ "$CONFIRM" != "RESTAURER" ]; then
    log "Restauration annulee."
    exit 0
fi

# ── Restauration ──────────────────────────────────────────────────────────────
log "Debut de la restauration depuis : $BACKUP_FILE"

# gunzip decompresse le fichier | psql execute le SQL
# --single-transaction : tout ou rien (si erreur → rollback complet)
# ON_ERROR_STOP=on     : arrêt immédiat à la première erreur SQL
gunzip -c "$BACKUP_FILE" | PGSSLMODE=require psql \
    --host="$PGHOST" \
    --port="$PGPORT" \
    --username="$PGUSER" \
    --dbname="$PGDATABASE" \
    --single-transaction \
    --set ON_ERROR_STOP=on

log "Restauration reussie depuis : $BACKUP_FILE"
log "Verifiez que l'app fonctionne : https://mycarecoach.app"
