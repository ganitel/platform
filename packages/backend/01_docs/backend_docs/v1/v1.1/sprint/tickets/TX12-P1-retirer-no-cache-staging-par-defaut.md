# TX12-P1-retirer-no-cache-staging-par-defaut

- Source backlog: A-06
- Priorité: P1
- Dépendances tickets: Aucune

## Tâche à accomplir
- Modifier le script de déploiement staging pour build caché par défaut.
- Ajouter option explicite de force rebuild (`--no-cache`).
- Aligner workflow CI staging si applicable.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 5.3 (contrat DevOps staging).

## DoD
- Build staging cache activé par défaut.
- Option force rebuild disponible et documentée.
- Mesure avant/après du temps de build fournie.
- Revue + merge `dev` + preuve de validation.
