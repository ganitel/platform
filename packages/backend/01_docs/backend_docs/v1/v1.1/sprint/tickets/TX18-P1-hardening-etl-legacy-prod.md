# TX18-P1-hardening-etl-legacy-prod

- Source backlog: C-03
- Priorité: P1
- Dépendances tickets: TX17
- Dépendance recommandée: TX11

## Tâche à accomplir
- Mettre en place checklist dry-run/apply ETL.
- Ajouter garde-fous d’intégrité (FK, mapping, seuil anomalies).
- Produire un rapport d’exécution exploitable ops.

## Interface / accord requis
- Requis: **Oui**
- Références: `interfaces_contrats.md` section 5.1 (stabilité DB), section 6.2/6.4, section 7.

## DoD
- Dry-run obligatoire et vérifié avant apply.
- Seuil anomalies bloquant implémenté.
- Rapport ETL standard exploitable livré.
- Revue + merge `dev` + preuve de validation.
