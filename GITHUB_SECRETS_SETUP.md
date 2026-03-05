# 🔐 Configuration GitHub Secrets pour Déploiement VPS

## Secrets Requis

Va dans : `GitHub Repo → Settings → Secrets and variables → Actions`

| Secret | Valeur | Description |
|--------|--------|-------------|
| `VITE_SUPABASE_URL` | `https://uztndpibiwgzcovrfrtk.supabase.co` | URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Clé anon Supabase |
| `VPS_HOST` | `76.13.61.89` | IP du VPS |
| `VPS_SSH_KEY` | *(voir ci-dessous)* | Clé SSH privée |

---

## 🔑 Générer et Configurer la Clé SSH

### 1. Sur ton VPS (si pas déjà fait)

```bash
ssh root@76.13.61.89

# Générer une clé dédiée pour GitHub Actions
cd /root
ssh-keygen -t ed25519 -C "github-actions@mycarecoach" -f /root/.ssh/github_actions

# Afficher la clé publique (à ajouter dans authorized_keys)
cat /root/.ssh/github_actions.pub >> /root/.ssh/authorized_keys

# Afficher la clé privée (à copier dans GitHub)
cat /root/.ssh/github_actions
```

### 2. Copier la clé privée dans GitHub

Copie tout le contenu (y compris `-----BEGIN OPENSSH PRIVATE KEY-----` et `-----END OPENSSH PRIVATE KEY-----`) dans le secret `VPS_SSH_KEY`.

---

## ✅ Test du Workflow

Après avoir configuré les secrets :

1. Push sur main : `git push origin main`
2. Vérifier l'exécution : GitHub → Actions
3. Le déploiement VPS se lance automatiquement

---

## 🛠️ Commandes Rapides

```bash
# Vérifier les clés sur VPS
ssh root@76.13.61.89 "cat .ssh/authorized_keys"

# Tester la connexion SSH
cd ~/.ssh
ssh -i id_ed25519 root@76.13.61.89 "echo 'Connexion OK'"
```
