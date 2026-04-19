# 🚀 Quick Start - Tests Ganitel V2 Backend

## Exécution rapide

### Tous les tests
```bash
./test.sh
```

### Avec couverture
```bash
./test.sh --coverage
```

### Tests spécifiques
```bash
# Tests d'authentification
pytest tests/test_auth_use_cases.py -v

# Tests d'intégration
pytest tests/test_integration.py -v

# Un test spécifique
pytest tests/test_auth_use_cases.py::TestRegisterUserUseCase::test_register_user_with_email_success -v
```

## Configuration

### Base de données de test

Par défaut, les tests utilisent PostgreSQL :
- Base : `ganitel_test_db`
- URL : `postgresql://postgres:123456789@localhost:5432/ganitel_test_db`

Pour changer :
```bash
export TEST_DATABASE_URL="postgresql://user:pass@host:port/dbname"
pytest
```

### Créer la base de test

```bash
# La base est créée automatiquement si elle n'existe pas
# Ou manuellement :
createdb -U postgres ganitel_test_db
```

## Structure

- `conftest.py` - Fixtures et configuration
- `test_*_use_cases.py` - Tests unitaires use cases
- `test_*_endpoints.py` - Tests d'intégration endpoints
- `test_status_transitions.py` - Tests transitions de statut
- `test_validation.py` - Tests validation
- `test_repositories.py` - Tests repositories
- `test_integration.py` - Tests flows complets

## Fixtures disponibles

- `db_session` - Session DB
- `client` - TestClient FastAPI
- `sample_user`, `sample_provider`, `sample_admin` - Utilisateurs de test
- `sample_service`, `sample_booking` - Entités de test
- `auth_token`, `provider_token`, `admin_token` - Tokens JWT
- `user_repository`, `service_repository`, `booking_repository` - Repositories

## Exemples

### Test simple
```python
def test_example(client, sample_user):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
```

### Test avec use case
```python
def test_example(user_repository):
    use_case = RegisterUserUseCase(user_repository)
    user = use_case.execute(...)
    assert user.email == "test@example.com"
```

---

**Pour plus de détails** : Voir `tests/README.md`

