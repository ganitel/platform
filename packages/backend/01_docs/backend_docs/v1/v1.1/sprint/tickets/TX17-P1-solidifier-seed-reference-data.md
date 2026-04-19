# TX17-P1-solidifier-seed-reference-data

- Source backlog: C-02
- Priorité: P1
- Dépendances tickets: TX01, TX02

## Tâche à accomplir
- Vérifier idempotence stricte des seeds.
- Ajouter tests intégration seed: double run, restore soft-delete, ordering.
- Produire un format de rapport d’exécution standard.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 6.2 (integration/API), section 6.4.

## DoD
- Tests seed intégration passants.
- Double exécution sans dérive fonctionnelle.
- Rapport seed standardisé disponible.
- Revue + merge `dev` + preuve de validation.
