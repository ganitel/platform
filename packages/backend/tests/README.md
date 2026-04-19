# Tests Ganitel Backend

Suite complète de tests pour l'application Ganitel.

## Structure des Tests

```
tests/
├── unit/                    # Tests unitaires
│   ├── auth/               # Tests d'authentification
│   ├── payments/           # Tests de paiements
│   ├── bookings/           # Tests de réservations
│   └── services/           # Tests de services
├── integration/            # Tests d'intégration
│   ├── auth/
│   ├── payments/
│   ├── bookings/
│   └── services/
├── e2e/                    # Tests end-to-end
│   └── test_payment_flow.py
├── performance/            # Tests de performance
│   └── test_api_performance.py
├── security/               # Tests de sécurité
│   └── test_security.py
└── conftest.py            # Configuration globale
```

## Types de Tests

### 1. Tests Unitaires
Tests des composants individuels en isolation.

```bash
# Exécuter tous les tests unitaires
pytest tests/unit/ -v

# Tests spécifiques
pytest tests/unit/payments/ -v
pytest tests/unit/auth/ -v
```

### 2. Tests d'Intégration
Tests des interactions entre composants avec la base de données.

```bash
# Exécuter tous les tests d'intégration
pytest tests/integration/ -v

# Tests spécifiques
pytest tests/integration/payments/ -v
```

### 3. Tests End-to-End (E2E)
Tests du flux complet de l'application.

```bash
# Exécuter les tests E2E
pytest tests/e2e/ -v
```

### 4. Tests de Performance
Tests de performance et de montée en charge.

```bash
# Exécuter les tests de performance
pytest tests/performance/ -v -m slow

# Tests de charge spécifiques
pytest tests/performance/test_api_performance.py::TestLoadTesting -v
```

### 5. Tests de Sécurité
Tests de sécurité et de vulnérabilités.

```bash
# Exécuter les tests de sécurité
pytest tests/security/ -v
```

## Exécution des Tests

### Tous les tests
```bash
pytest tests/ -v
```

### Par catégorie (markers)
```bash
# Tests unitaires uniquement
pytest -m unit -v

# Tests d'intégration uniquement
pytest -m integration -v

# Tests E2E uniquement
pytest -m e2e -v

# Tests lents
pytest -m slow -v

# Tests nécessitant des services externes
pytest -m external -v
```

### Par module
```bash
# Tests de paiements
pytest -m payment -v

# Tests d'authentification
pytest -m auth -v

# Tests de réservations
pytest -m booking -v
```

### Avec couverture de code
```bash
# Générer un rapport de couverture
pytest tests/ --cov=app --cov-report=html --cov-report=term

# Voir le rapport HTML
open htmlcov/index.html
```

### Tests parallèles
```bash
# Installer pytest-xdist
pip install pytest-xdist

# Exécuter en parallèle
pytest tests/ -n auto
```

## Script Automatisé

Utiliser le script `run_tests.py` pour exécuter tous les tests :

```bash
# Tous les tests
python3 run_tests.py all

# Tests spécifiques
python3 run_tests.py unit
python3 run_tests.py integration
python3 run_tests.py e2e
python3 run_tests.py coverage
python3 run_tests.py lint
python3 run_tests.py security
```

## Configuration

### Base de données de test
Les tests utilisent une base de données PostgreSQL séparée :
```
DATABASE_URL=postgresql://ganitel_user:ganitel_password@localhost:5432/ganitel_test_db
```

### Variables d'environnement
Créer un fichier `.env.test` :
```env
TESTING=true
DATABASE_URL=postgresql://ganitel_user:ganitel_password@localhost:5432/ganitel_test_db
SECRET_KEY=test-secret-key
DEBUG=true
ENVIRONMENT=testing
```

## Fixtures Disponibles

### Fixtures de base
- `client`: Client de test FastAPI
- `db_session`: Session de base de données
- `event_loop`: Boucle d'événements pour tests async

### Fixtures utilisateurs
- `test_user`: Utilisateur traveler de test
- `test_provider`: Provider de test
- `test_admin`: Admin de test
- `auth_headers`: Headers d'authentification
- `provider_auth_headers`: Headers pour provider
- `admin_auth_headers`: Headers pour admin

### Fixtures de données
- `test_data`: Données complètes (provider, service, traveler)
- `mock_tranzak_success`: Mock Tranzak succès
- `mock_tranzak_failure`: Mock Tranzak échec

## Bonnes Pratiques

### 1. Isolation des tests
Chaque test doit être indépendant et ne pas dépendre d'autres tests.

### 2. Nettoyage
Les fixtures nettoient automatiquement la base de données après chaque test.

### 3. Mocking
Utiliser des mocks pour les services externes (Tranzak, etc.).

### 4. Assertions claires
```python
# ✅ Bon
assert response.status_code == 200, f"Expected 200, got {response.status_code}"

# ❌ Mauvais
assert response.status_code == 200
```

### 5. Tests descriptifs
```python
# ✅ Bon
def test_payment_initiation_fails_with_invalid_booking_id():
    ...

# ❌ Mauvais
def test_payment():
    ...
```

## Debugging

### Afficher les logs
```bash
pytest tests/ -v -s
```

### Arrêter au premier échec
```bash
pytest tests/ -x
```

### Exécuter un test spécifique
```bash
pytest tests/unit/payments/test_initiate_payment_use_case.py::TestInitiatePaymentUseCase::test_initiate_payment_success -v
```

### Mode debug
```bash
pytest tests/ --pdb
```

## Métriques de Qualité

### Couverture de code cible
- **Minimum**: 80%
- **Objectif**: 90%+

### Performance
- Endpoints API: < 100ms (95e percentile)
- Requêtes DB: < 50ms
- Tests unitaires: < 1s par test
- Tests d'intégration: < 5s par test

### Sécurité
- Tous les tests de sécurité doivent passer
- Aucune vulnérabilité critique
- Validation stricte des entrées

## CI/CD

Les tests sont exécutés automatiquement sur :
- Chaque push
- Chaque pull request
- Avant chaque déploiement

### Pipeline
1. Tests unitaires
2. Tests d'intégration
3. Tests de sécurité
4. Analyse de couverture
5. Linting et formatage
6. Tests E2E (staging)

## Maintenance

### Ajouter un nouveau test
1. Créer le fichier dans le bon dossier
2. Ajouter les markers appropriés
3. Utiliser les fixtures existantes
4. Documenter le test
5. Vérifier la couverture

### Mettre à jour les fixtures
Modifier `conftest.py` pour ajouter de nouvelles fixtures globales.

### Résoudre les tests flaky
- Identifier avec `pytest --count=10`
- Ajouter des attentes explicites
- Améliorer l'isolation
- Utiliser des mocks stables

## Support

Pour toute question sur les tests :
1. Consulter cette documentation
2. Vérifier les exemples dans les fichiers de test
3. Contacter l'équipe de développement

## Ressources

- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/14/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)
