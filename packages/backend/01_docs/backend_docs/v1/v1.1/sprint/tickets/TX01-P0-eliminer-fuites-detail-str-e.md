# TX01-P0-eliminer-fuites-detail-str-e

- Source backlog: A-01
- Priorité: P0
- Dépendances tickets: Aucune

## Tâche à accomplir
- Supprimer les retours `detail=str(e)` sur endpoints critiques (auth, paiements, admin, wallets, reviews, coupons).
- Remplacer par des messages API neutres.
- Logger le détail côté serveur (`logger.exception`) avec contexte utile.
- Produire une checklist des occurrences corrigées.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 1 (Contrat transversal d’erreur API), section 7 (DoR/DoD opérationnel).

## DoD
- Plus aucune occurrence `detail=str(e)` sur endpoints critiques ciblés.
- Tests API négatifs: exception provoquée => payload générique (sans fuite interne).
- Code mergé sur `dev` avec revue.
- Preuve de validation fournie (commande/résultat).
