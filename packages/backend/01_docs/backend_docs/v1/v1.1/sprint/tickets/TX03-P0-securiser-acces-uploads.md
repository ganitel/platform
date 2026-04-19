# TX03-P0-securiser-acces-uploads

- Source backlog: A-03
- Priorité: P0
- Dépendances tickets: TX01, TX02

## Tâche à accomplir
- Retirer l’exposition publique brute des uploads en staging/prod.
- Introduire un endpoint de téléchargement contrôlé (auth + autorisation).
- Journaliser les accès refusés.
- Documenter la compatibilité frontend (migration URLs/flux).

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 3 (Contrat d’accès médias/upload), section 1 (erreurs API), section 7.

## DoD
- Anonyme: 401/403.
- Utilisateur autorisé: 200.
- Chemin/référence invalide: 400.
- Plus de flux d’accès public brut en staging/prod.
- Revue + merge `dev` + preuve de validation.
