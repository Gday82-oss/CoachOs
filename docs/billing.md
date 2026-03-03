# 💰 SYSTÈME DE FACTURATION - RÉCAPITULATIF

## ✅ Implémenté

### Tables SQL ajoutées (`supabase_schema.sql`)

```sql
-- Table factures
CREATE TABLE factures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id),
  client_id UUID REFERENCES clients(id),
  numero TEXT UNIQUE NOT NULL,        -- Auto: FACT-2026-0001
  date_emission DATE DEFAULT CURRENT_DATE,
  date_echeance DATE,
  montant_ht NUMERIC(10,2) NOT NULL,
  tva_percent NUMERIC(5,2) DEFAULT 20,
  montant_ttc NUMERIC(10,2) NOT NULL,
  description TEXT,
  statut TEXT CHECK (statut IN ('brouillon', 'envoyee', 'payee', 'retard', 'annulee')),
  mode_paiement TEXT CHECK (mode_paiement IN ('cheque', 'especes', 'virement', 'non_paye')),
  date_paiement DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table lignes de facture (pour détail)
CREATE TABLE facture_lignes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID REFERENCES factures(id),
  description TEXT NOT NULL,
  quantite INTEGER DEFAULT 1,
  prix_unitaire_ht NUMERIC(10,2),
  total_ht NUMERIC(10,2)
);
```

### Page Paiements.tsx - Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| **Stats** | Encaissé, En attente, En retard, Clients facturés |
| **Liste** | Numéro, Client, Date, Montant TTC, Statut |
| **Filtres** | Recherche par client/numéro, filtre par statut |
| **Création** | Sélection client, montant HT, TVA (0/10/20%), date échéance |
| **Gestion statut** | Brouillon → Envoyée → Payée (avec mode de paiement) |
| **Suppression** | Suppression de facture avec confirmation |

### Modes de paiement supportés
- 💳 **Chèque**
- 💵 **Espèces**  
- 🏦 **Virement**

### Numérotation auto
Format : `FACT-AAAA-NNNN`
Exemple : `FACT-2026-0001`, `FACT-2026-0002`...

---

## 🧪 Pour tester

1. **Exécuter le SQL** dans Supabase SQL Editor
2. **Créer un client**
3. **Aller dans "Factures"**
4. **Créer une facture** :
   - Sélectionner le client
   - Montant HT (ex: 100€)
   - TVA 20%
   - Total TTC calculé auto : 120€
5. **Changer le statut** :
   - Brouillon → Envoyée (quand envoyée au client)
   - Envoyée → Payée (sélectionner mode: chèque/espèces/virement)

---

## 📊 Dashboard stats

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Encaissé   │ En attente  │  En retard  │   Clients   │
│   2,400€    │   800€      │    200€     │     12      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🚀 Prochaines améliorations possibles

1. **Export PDF** des factures
2. **Relances automatiques** pour factures en retard
3. **Historique des paiements** détaillé
4. **Statistiques par client** (CA total, dernière facture...)
5. **Génération de devis** (avant facture)

---

*Système prêt à l'emploi !* ✅
