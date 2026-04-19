# Tests de Charge avec Locust

Tests de montée en charge pour l'API Ganitel utilisant Locust.

## Installation

```bash
pip install locust
```

## Exécution

### Mode Interface Web

```bash
# Démarrer Locust avec interface web
locust -f tests/load/locustfile.py --host=http://localhost:8000

# Ouvrir le navigateur
open http://localhost:8089
```

Dans l'interface :
1. Définir le nombre d'utilisateurs (ex: 100)
2. Définir le taux de spawn (ex: 10 utilisateurs/seconde)
3. Cliquer sur "Start swarming"

### Mode Headless (Sans Interface)

```bash
# Test de charge standard
locust -f tests/load/locustfile.py \
       --host=http://localhost:8000 \
       --users 100 \
       --spawn-rate 10 \
       --run-time 5m \
       --headless

# Avec rapport HTML
locust -f tests/load/locustfile.py \
       --host=http://localhost:8000 \
       --users 100 \
       --spawn-rate 10 \
       --run-time 5m \
       --headless \
       --html=reports/load_test_report.html \
       --csv=reports/load_test
```

## Scénarios de Test

### 1. Charge Normale
Simule une utilisation normale avec 80% de travelers et 20% de providers.

```bash
locust -f tests/load/locustfile.py \
       --host=http://localhost:8000 \
       --users 100 \
       --spawn-rate 10 \
       --run-time 10m \
       --headless
```

**Objectifs:**
- Taux de succès: > 99%
- Temps de réponse moyen: < 200ms
- 95e percentile: < 500ms

### 2. Pic de Charge (Stress Test)
Test de résistance avec un pic soudain d'utilisateurs.

```bash
locust -f tests/load/locustfile.py \
       --host=http://localhost:8000 \
       --users 500 \
       --spawn-rate 50 \
       --run-time 5m \
       --headless
```

**Objectifs:**
- Taux de succès: > 95%
- Temps de réponse moyen: < 500ms
- Pas de crash du système

### 3. Charge Soutenue (Endurance Test)
Test d'endurance sur une longue période.

```bash
locust -f tests/load/locustfile.py \
       --host=http://localhost:8000 \
       --users 200 \
       --spawn-rate 20 \
       --run-time 1h \
       --headless
```

**Objectifs:**
- Taux de succès: > 98%
- Pas de dégradation des performances
- Pas de fuite mémoire

### 4. Test de Montée Progressive
Augmentation progressive de la charge.

```bash
# Démarrer avec 10 utilisateurs
locust -f tests/load/locustfile.py \
       --host=http://localhost:8000 \
       --users 10 \
       --spawn-rate 1 \
       --run-time 2m \
       --headless

# Puis augmenter progressivement
# 50 utilisateurs
# 100 utilisateurs
# 200 utilisateurs
# etc.
```

## Types d'Utilisateurs

### GanitelUser (Traveler)
Simule un voyageur qui :
- Recherche des services
- Consulte les détails
- Crée des réservations
- Initie des paiements
- Consulte son profil

**Poids des tâches:**
- Recherche: 20%
- Consultation: 15%
- Réservation: 5%
- Paiement: 3%

### ProviderUser
Simule un prestataire qui :
- Consulte ses services
- Crée de nouveaux services
- Met à jour ses services
- Consulte les réservations
- Consulte son tableau de bord

**Poids des tâches:**
- Consultation services: 10%
- Création service: 2%
- Mise à jour: 3%
- Dashboard: 8%

## Métriques Surveillées

### Performance
- **Temps de réponse moyen**: Doit être < 200ms
- **Médiane**: Doit être < 150ms
- **95e percentile**: Doit être < 500ms
- **99e percentile**: Doit être < 1000ms

### Fiabilité
- **Taux de succès**: Doit être > 99%
- **Taux d'erreur**: Doit être < 1%
- **Timeouts**: Doit être < 0.1%

### Capacité
- **Requêtes/seconde**: Objectif > 100 req/s
- **Utilisateurs concurrents**: Objectif > 500
- **Débit**: Objectif > 10 MB/s

## Analyse des Résultats

### Rapport HTML
Le rapport HTML contient :
- Graphiques de temps de réponse
- Distribution des requêtes
- Taux d'échec par endpoint
- Évolution dans le temps

### Fichiers CSV
Les fichiers CSV contiennent :
- `*_stats.csv`: Statistiques par endpoint
- `*_stats_history.csv`: Historique des statistiques
- `*_failures.csv`: Liste des échecs

### Interprétation

**Bon résultat:**
```
Total requests: 10000
Failures: 50 (0.5%)
Average response time: 150ms
95th percentile: 400ms
RPS: 120
```

**Résultat préoccupant:**
```
Total requests: 10000
Failures: 500 (5%)
Average response time: 800ms
95th percentile: 2000ms
RPS: 50
```

## Optimisations

### Si les performances sont insuffisantes:

1. **Base de données**
   - Ajouter des index
   - Optimiser les requêtes
   - Utiliser le cache

2. **Application**
   - Activer le cache Redis
   - Optimiser les sérialisations
   - Réduire les appels externes

3. **Infrastructure**
   - Augmenter les ressources
   - Ajouter des workers
   - Utiliser un load balancer

## Monitoring en Production

### Outils recommandés
- **Prometheus**: Métriques
- **Grafana**: Visualisation
- **Sentry**: Erreurs
- **New Relic**: APM

### Alertes à configurer
- Temps de réponse > 500ms
- Taux d'erreur > 1%
- CPU > 80%
- Mémoire > 85%
- Disque > 90%

## Bonnes Pratiques

1. **Tester régulièrement**
   - Avant chaque release
   - Après chaque optimisation
   - Mensuellement en production

2. **Environnement de test**
   - Utiliser un environnement similaire à la production
   - Données de test réalistes
   - Configuration identique

3. **Analyse progressive**
   - Commencer avec peu d'utilisateurs
   - Augmenter progressivement
   - Identifier le point de rupture

4. **Documentation**
   - Documenter les résultats
   - Comparer avec les tests précédents
   - Suivre l'évolution

## Troubleshooting

### Erreurs de connexion
```bash
# Vérifier que l'API est accessible
curl http://localhost:8000/api/v1/health/

# Vérifier les logs
tail -f logs/app.log
```

### Timeouts
```bash
# Augmenter le timeout dans Locust
locust -f tests/load/locustfile.py \
       --host=http://localhost:8000 \
       --timeout=30
```

### Trop d'échecs
- Vérifier les logs de l'application
- Vérifier la base de données
- Vérifier les ressources système
- Réduire le nombre d'utilisateurs

## Ressources

- [Documentation Locust](https://docs.locust.io/)
- [Best Practices](https://docs.locust.io/en/stable/writing-a-locustfile.html)
- [Configuration](https://docs.locust.io/en/stable/configuration.html)
