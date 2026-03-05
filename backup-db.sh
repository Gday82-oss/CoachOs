#!/bin/bash
# =============================================================================
# MyCareCoach — Backup automatique base de données Supabase
# =============================================================================
# Cron : 0 3 * * * /home/deploy/backup-db.sh >> /var/log/mycarecoach-backup.log 2>&1
# Prérequis : /etc/mycarecoach-backup.env avec PGHOST, PGPORT, PGUSER,
#             PGDATABASE, PGPASSWORD
# =============================================================================
set -euo pipefail

BACKUP_DIR="/var/backups/mycarecoach"
MAX_BACKUPS=30
LOG_FILE="/var/log/mycarecoach-backup.log"
ENV_FILE="/etc/mycarecoach-backup.env"
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql.gz"

# ── Charger les credentials ───────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERREUR : $ENV_FILE introuvable" | tee -a "$LOG_FILE"
    exit 1
fi
# shellcheck source=/dev/null
source "$ENV_FILE"
export PGPASSWORD PGHOST PGPORT PGUSER PGDATABASE

# ── Logger ────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

# ── Alerte email en cas d'echec ───────────────────────────────────────────────
send_alert() {
    log "ALERTE ECHEC : $1"
    if [ -n "${ALERT_EMAIL:-}" ] && command -v mail &>/dev/null; then
        echo "$1" | mail -s "[MyCareCoach] ECHEC BACKUP $(date '+%d/%m/%Y')" "$ALERT_EMAIL"
    fi
}
trap 'CODE=$?; send_alert "Echec backup (code $CODE). Voir $LOG_FILE"; rm -f "$BACKUP_FILE"; exit $CODE' ERR

# ── Demarrage ─────────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

log "============================================"
log "Demarrage backup MyCareCoach..."
log "Cible : $BACKUP_FILE"

# ── pg_dump → gzip ───────────────────────────────────────────────────────────
# PGSSLMODE=require     : connexion chiffrée vers Supabase (obligatoire)
# --no-owner --no-acl   : dump portable, sans droits Supabase spécifiques
# --format=plain        : SQL lisible, restaurable avec psql
PGSSLMODE=require pg_dump \
    --host="$PGHOST" \
    --port="$PGPORT" \
    --username="$PGUSER" \
    --dbname="$PGDATABASE" \
    --no-owner \
    --no-acl \
    --format=plain \
    | gzip > "$BACKUP_FILE"

# ── Vérification taille minimale ─────────────────────────────────────────────
SIZE_BYTES=$(stat -c%s "$BACKUP_FILE")
if [ "$SIZE_BYTES" -lt 500 ]; then
    send_alert "Backup trop petit (${SIZE_BYTES} octets) — possible echec silencieux."
    rm -f "$BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
log "Backup OK : $BACKUP_FILE (${BACKUP_SIZE})"

# ── Rotation : garder seulement les 30 derniers ───────────────────────────────
COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
if [ "$COUNT" -gt "$MAX_BACKUPS" ]; then
    DEL=$(( COUNT - MAX_BACKUPS ))
    find "$BACKUP_DIR" -name "backup_*.sql.gz" | sort | head -n "$DEL" | xargs rm -f
    log "Rotation : $DEL ancien(s) backup(s) supprime(s)."
fi

log "Termine. Backups conserves : $(find "$BACKUP_DIR" -name "*.sql.gz" | wc -l)/$MAX_BACKUPS"
log "============================================"
