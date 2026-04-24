"""
Tests de performance pour l'API Ganitel
T12: Utilise la factory app uniforme
"""

import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest


class TestAPIPerformance:
    """Tests de performance pour l'API"""

    # T12: Utilise la fixture client uniforme du conftest.py au lieu de créer sa propre

    @pytest.mark.slow
    def test_health_endpoint_performance(self, client):
        """Test performance de l'endpoint health"""
        start_time = time.time()

        # Faire 100 requêtes
        for _ in range(100):
            response = client.get("/api/v1/health/")
            assert response.status_code == 200

        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / 100

        print("\n📊 Performance Health Endpoint:")
        print(f"   Temps total: {total_time:.2f}s")
        print(f"   Temps moyen: {avg_time:.4f}s")
        print(f"   Requêtes/seconde: {100 / total_time:.2f}")

        # Assertion: chaque requête doit prendre moins de 100ms
        assert avg_time < 0.1, f"Performance dégradée: {avg_time:.4f}s > 0.1s"

    @pytest.mark.slow
    def test_concurrent_requests(self, client):
        """Test requêtes concurrentes sur endpoint public"""

        def make_request():
            # Use public health endpoint for concurrent testing
            response = client.get("/api/v1/health/")
            return response.status_code == 200

        start_time = time.time()

        # Exécuter 50 requêtes concurrentes
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(lambda _: make_request(), range(50)))

        end_time = time.time()
        total_time = end_time - start_time

        success_count = sum(results)

        print("\n📊 Performance Requêtes Concurrentes:")
        print(f"   Temps total: {total_time:.2f}s")
        print(f"   Requêtes réussies: {success_count}/50")
        print(f"   Débit: {50 / total_time:.2f} req/s")

        assert success_count >= 48, "Trop d'échecs dans les requêtes concurrentes"

    @pytest.mark.slow
    def test_database_query_performance(self, client, db_session, test_data):
        """Test performance des requêtes base de données"""
        from app.domain.entities.service import Service

        provider = test_data["provider"]

        # Créer 100 services
        for i in range(100):
            service = Service(
                id=uuid4(),
                provider_id=provider.id,
                title=f"Service {i}",
                description=f"Description {i}",
                service_type="accommodation",
                country="Cameroon",
                city="Douala",
                address=f"Address {i}",  # Required field
                base_price=Decimal("50000.00"),
                currency="XAF",
                status="active",
                is_active=True,
            )
            db_session.add(service)

        db_session.commit()

        # Mesurer le temps de récupération
        start_time = time.time()

        response = client.get("/api/v1/services/?limit=100")

        end_time = time.time()
        query_time = end_time - start_time

        print("\n📊 Performance Requête DB (100 services):")
        print(f"   Temps de requête: {query_time:.4f}s")

        assert response.status_code == 200
        assert query_time < 1.0, f"Requête trop lente: {query_time:.4f}s"

    @pytest.mark.slow
    def test_payment_initiation_performance(
        self, client, auth_headers, test_data, db_session
    ):
        """Test performance d'initiation de paiement"""
        from app.domain.entities.booking import Booking, BookingStatus

        service = test_data["service"]
        traveler = test_data["traveler"]

        # Créer une réservation
        booking = Booking(
            id=uuid4(),
            user_id=traveler.id,
            service_id=service.id,
            start_date=date(2026, 12, 1),
            end_date=date(2026, 12, 5),
            guests=2,
            status=BookingStatus.PENDING.value,
            total_amount=Decimal("200000.00"),
            currency="XAF",
            is_active=True,
        )
        db_session.add(booking)
        db_session.commit()

        start_time = time.time()

        client.post(
            "/api/v1/payments/initiate",
            json={"booking_id": str(booking.id), "payment_method": "mtn"},
            headers=auth_headers,
        )

        end_time = time.time()
        initiation_time = end_time - start_time

        print("\n📊 Performance Initiation Paiement:")
        print(f"   Temps d'initiation: {initiation_time:.4f}s")

        # Le paiement peut échouer avec Tranzak mais doit répondre rapidement
        assert initiation_time < 5.0, f"Initiation trop lente: {initiation_time:.4f}s"

    @pytest.mark.slow
    def test_search_performance(self, client, db_session, test_data):
        """Test performance de recherche"""
        from app.domain.entities.service import Service

        provider = test_data["provider"]

        # Créer 200 services avec différentes villes
        cities = ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Limbé"]

        for i in range(200):
            service = Service(
                id=uuid4(),
                provider_id=provider.id,
                title=f"Hotel {i}",
                description=f"Description {i}",
                service_type="accommodation",
                country="Cameroon",
                city=cities[i % len(cities)],
                address=f"Address {i}",  # Required field
                base_price=Decimal(f"{30000 + i * 100}.00"),
                currency="XAF",
                status="active",
                is_active=True,
            )
            db_session.add(service)

        db_session.commit()

        # Test recherche par ville
        start_time = time.time()

        response = client.get("/api/v1/services/?city=Douala&limit=50")

        end_time = time.time()
        search_time = end_time - start_time

        print("\n📊 Performance Recherche (200 services):")
        print(f"   Temps de recherche: {search_time:.4f}s")

        assert response.status_code == 200
        assert search_time < 2.0, f"Recherche trop lente: {search_time:.4f}s"

    @pytest.mark.slow
    def test_authentication_performance(self, client):
        """Test performance d'authentification"""
        login_times = []

        for _ in range(20):
            start_time = time.time()

            client.post(
                "/api/v1/auth/login",
                json={"identifier": "test@example.com", "password": "password123"},
            )

            end_time = time.time()
            login_times.append(end_time - start_time)

        avg_login_time = sum(login_times) / len(login_times)
        max_login_time = max(login_times)

        print("\n📊 Performance Authentification (20 tentatives):")
        print(f"   Temps moyen: {avg_login_time:.4f}s")
        print(f"   Temps max: {max_login_time:.4f}s")

        assert avg_login_time < 0.5, (
            f"Authentification trop lente: {avg_login_time:.4f}s"
        )


class TestLoadTesting:
    """Tests de montée en charge"""

    # T12: Utilise la fixture client uniforme du conftest.py

    @pytest.mark.slow
    @pytest.mark.external
    def test_load_100_concurrent_users(self, client):
        """Test avec 100 utilisateurs concurrents"""

        def simulate_user():
            try:
                # Simuler un parcours utilisateur
                # 1. Consulter la page d'accueil
                client.get("/api/v1/health/")

                # 2. Rechercher des services
                client.get("/api/v1/services/?limit=10")

                # 3. Consulter un service
                client.get("/api/v1/services/")

                return True
            except Exception:
                return False

        start_time = time.time()

        with ThreadPoolExecutor(max_workers=20) as executor:
            results = list(executor.map(lambda _: simulate_user(), range(100)))

        end_time = time.time()
        total_time = end_time - start_time

        success_rate = sum(results) / len(results) * 100

        print("\n📊 Test de Charge - 100 Utilisateurs:")
        print(f"   Temps total: {total_time:.2f}s")
        print(f"   Taux de succès: {success_rate:.1f}%")
        print(f"   Débit: {100 / total_time:.2f} utilisateurs/s")

        assert success_rate >= 95, f"Taux de succès trop faible: {success_rate:.1f}%"
        assert total_time < 30, f"Temps de réponse trop long: {total_time:.2f}s"

    @pytest.mark.slow
    @pytest.mark.external
    def test_sustained_load(self, client):
        """Test de charge soutenue sur 60 secondes"""

        def make_request():
            try:
                response = client.get("/api/v1/health/")
                return response.status_code == 200
            except Exception:
                return False

        start_time = time.time()
        request_count = 0
        success_count = 0

        # Faire des requêtes pendant 60 secondes
        while time.time() - start_time < 60:
            with ThreadPoolExecutor(max_workers=5) as executor:
                results = list(executor.map(lambda _: make_request(), range(10)))
                request_count += 10
                success_count += sum(results)

        end_time = time.time()
        total_time = end_time - start_time

        success_rate = success_count / request_count * 100
        throughput = request_count / total_time

        print("\n📊 Test de Charge Soutenue (60s):")
        print(f"   Requêtes totales: {request_count}")
        print(f"   Requêtes réussies: {success_count}")
        print(f"   Taux de succès: {success_rate:.1f}%")
        print(f"   Débit moyen: {throughput:.2f} req/s")

        assert success_rate >= 98, f"Taux de succès insuffisant: {success_rate:.1f}%"

    @pytest.mark.slow
    def test_spike_load(self, client):
        """Test de pic de charge soudain"""

        def make_request():
            try:
                response = client.get("/api/v1/services/?limit=5")
                return response.status_code == 200
            except Exception:
                return False

        # Phase 1: Charge normale (10 requêtes)
        start_time = time.time()
        normal_results = [make_request() for _ in range(10)]
        normal_time = time.time() - start_time

        # Phase 2: Pic de charge (100 requêtes concurrentes)
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=20) as executor:
            spike_results = list(executor.map(lambda _: make_request(), range(100)))
        spike_time = time.time() - start_time

        # Phase 3: Retour à la normale (10 requêtes)
        start_time = time.time()
        recovery_results = [make_request() for _ in range(10)]
        recovery_time = time.time() - start_time

        normal_success = sum(normal_results) / len(normal_results) * 100
        spike_success = sum(spike_results) / len(spike_results) * 100
        recovery_success = sum(recovery_results) / len(recovery_results) * 100

        print("\n📊 Test de Pic de Charge:")
        print(f"   Phase normale: {normal_success:.1f}% succès en {normal_time:.2f}s")
        print(f"   Phase pic: {spike_success:.1f}% succès en {spike_time:.2f}s")
        print(
            f"   Phase récupération: {recovery_success:.1f}% succès en {recovery_time:.2f}s"
        )

        assert spike_success >= 90, (
            f"Système instable pendant le pic: {spike_success:.1f}%"
        )
        assert recovery_success >= 95, (
            f"Récupération insuffisante: {recovery_success:.1f}%"
        )

    @pytest.mark.slow
    def test_memory_leak_detection(self, client):
        """Test de détection de fuites mémoire"""
        import os

        import psutil

        process = psutil.Process(os.getpid())

        # Mesure initiale
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Faire 1000 requêtes
        for _ in range(1000):
            client.get("/api/v1/health/")

        # Mesure finale
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory

        print("\n📊 Test de Fuite Mémoire:")
        print(f"   Mémoire initiale: {initial_memory:.2f} MB")
        print(f"   Mémoire finale: {final_memory:.2f} MB")
        print(f"   Augmentation: {memory_increase:.2f} MB")

        # L'augmentation ne doit pas dépasser 50 MB pour 1000 requêtes
        assert memory_increase < 50, (
            f"Fuite mémoire potentielle: +{memory_increase:.2f} MB"
        )


class TestStressTest:
    """Tests de stress pour identifier les limites"""

    # T12: Utilise la fixture client uniforme du conftest.py

    @pytest.mark.slow
    @pytest.mark.external
    def test_maximum_concurrent_connections(self, client):
        """Test du nombre maximum de connexions concurrentes"""

        def make_request():
            try:
                response = client.get("/api/v1/health/")
                return response.status_code == 200
            except Exception:
                return False

        # Tester avec différents niveaux de concurrence
        concurrency_levels = [10, 50, 100, 200, 500]
        results = {}

        for level in concurrency_levels:
            start_time = time.time()

            with ThreadPoolExecutor(max_workers=level) as executor:
                level_results = list(
                    executor.map(lambda _: make_request(), range(level))
                )

            end_time = time.time()

            success_rate = sum(level_results) / len(level_results) * 100
            response_time = end_time - start_time

            results[level] = {
                "success_rate": success_rate,
                "response_time": response_time,
                "throughput": level / response_time,
            }

        print("\n📊 Test de Connexions Concurrentes:")
        for level, data in results.items():
            print(
                f"   {level} connexions: {data['success_rate']:.1f}% succès, "
                f"{data['response_time']:.2f}s, {data['throughput']:.2f} req/s"
            )

        # Au moins 100 connexions concurrentes doivent fonctionner
        assert results[100]["success_rate"] >= 95, (
            "Échec avec 100 connexions concurrentes"
        )

    @pytest.mark.slow
    def test_large_payload_handling(self, client, auth_headers):
        """Test de gestion de grandes charges utiles"""
        # Créer un payload volumineux
        large_description = "A" * 10000  # 10KB de texte

        start_time = time.time()

        response = client.post(
            "/api/v1/services/",
            json={
                "title": "Large Payload Test",
                "description": large_description,
                "service_type": "accommodation",
                "country": "Cameroon",
                "city": "Douala",
                "base_price": 50000.0,
                "currency": "XAF",
            },
            headers=auth_headers,
        )

        end_time = time.time()
        processing_time = end_time - start_time

        print("\n📊 Test de Grande Charge Utile:")
        print("   Taille du payload: 10 KB")
        print(f"   Temps de traitement: {processing_time:.4f}s")
        print(f"   Status: {response.status_code}")

        assert processing_time < 2.0, f"Traitement trop lent: {processing_time:.4f}s"

    @pytest.mark.slow
    def test_rapid_fire_requests(self, client):
        """Test de rafale de requêtes rapides"""
        request_times = []

        for _ in range(100):
            start_time = time.time()
            response = client.get("/api/v1/health/")
            end_time = time.time()

            request_times.append(end_time - start_time)
            assert response.status_code == 200

        avg_time = sum(request_times) / len(request_times)
        max_time = max(request_times)
        min_time = min(request_times)

        print("\n📊 Test de Rafale de Requêtes (100 requêtes):")
        print(f"   Temps moyen: {avg_time:.4f}s")
        print(f"   Temps min: {min_time:.4f}s")
        print(f"   Temps max: {max_time:.4f}s")

        assert avg_time < 0.1, f"Temps de réponse moyen trop élevé: {avg_time:.4f}s"
        assert max_time < 0.5, f"Temps de réponse max trop élevé: {max_time:.4f}s"
