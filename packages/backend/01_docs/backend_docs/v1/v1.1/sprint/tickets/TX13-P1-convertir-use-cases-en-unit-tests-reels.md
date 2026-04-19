# TX13-P1-convertir-use-cases-en-unit-tests-reels

- Source backlog: A-08
- Priorité: P1
- Dépendances tickets: Aucune

## Tâche à accomplir
- Isoler tests use cases auth/services avec mocks des repositories/services externes.
- Supprimer les dépendances DB/réseau dans les tests unitaires ciblés.
- Structurer une suite `unit` rapide et déterministe.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 6.1 (unit), section 6.4.

## DoD
- `pytest -m unit` fiable et reproductible.
- Pas d’accès DB/réseau dans les tests unitaires ciblés.
- Temps d’exécution unitaire réduit/maîtrisé.
- Revue + merge `dev` + preuve de validation.
