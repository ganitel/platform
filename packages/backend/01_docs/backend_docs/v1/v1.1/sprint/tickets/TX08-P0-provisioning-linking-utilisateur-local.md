# TX08-P0-provisioning-linking-utilisateur-local

- Source backlog: B-04
- Priorité: P0
- Dépendances tickets: TX07

## Tâche à accomplir
- Créer service de provisioning local à la première requête valide.
- Faire un upsert idempotent via `sub` + email.
- Gérer collisions email/sub explicitement.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 4.2 (UserProvisioningService), section 4.3.

## DoD
- Cas couverts: nouveau user, user existant, collision email/sub.
- Pas de doublons créés.
- Service documenté et branché sur le flux auth.
- Revue + merge `dev` + preuve de validation.
