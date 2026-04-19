# T10 — Uploads: validation + R2

**Priorité**: P0 (T10)
**Estimation**: 3 jours
**Dépendances**: config R2 (infra)

## Objectif
Valider les uploads et migrer vers Cloudflare R2.

## Tâches
- Ajout config R2.
- Upload direct vers R2 + URL CDN.
- Validation MIME/extension/taille.

## Critères d’acceptation
- Upload retourne URL R2.
- Fichiers invalides rejetés.

## Références
- Backlog: [01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md](01_docs/01_v1/sprint_planning/backlog/sprint_backlog.md)
