# TX09-P0-decommission-auth-legacy

- Source backlog: B-05
- Priorité: P0
- Dépendances tickets: TX07, TX08, TX15

## Tâche à accomplir
- Désactiver/retirer endpoints auth legacy (login/register/refresh/oauth legacy backend).
- Maintenir uniquement les endpoints nécessaires au domaine après cutover.
- Publier checklist d’impact frontend.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 4.3, section 6 (tests), section 7.

## DoD
- Endpoints legacy non disponibles (tests de non-disponibilité passants).
- Contrat API auth nettoyé et communiqué.
- Checklist d’impact frontend validée.
- Revue + merge `dev` + preuve de validation.
