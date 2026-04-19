# TX20-P2-timezone-aware-nettoyage-tests-morts

- Source backlog: A-09
- Priorité: P2
- Dépendances tickets: Aucune

## Tâche à accomplir
- Remplacer usages ciblés de `datetime.utcnow()` par datetimes timezone-aware.
- Retirer/archiver code test mort (ex: `test_base.py` inutilisé si confirmé).
- Valider non-régression.

## Interface / accord requis
- Requis: **Non bloquant**
- Références: appliquer les règles générales `interfaces_contrats.md` section 7.

## DoD
- Aucun usage ciblé restant de `datetime.utcnow()` sur périmètre ticket.
- Nettoyage tests morts effectué sans casser la suite.
- Tests non-régression passants.
- Revue + merge `dev` + preuve de validation.
