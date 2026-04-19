"""
Tests de charge avec Locust pour Ganitel API

Installation:
    pip install locust

Exécution:
    # Interface web
    locust -f tests/load/locustfile.py --host=http://localhost:8000
    
    # Mode headless (sans interface)
    locust -f tests/load/locustfile.py --host=http://localhost:8000 \
           --users 100 --spawn-rate 10 --run-time 5m --headless

    # Avec rapport HTML
    locust -f tests/load/locustfile.py --host=http://localhost:8000 \
           --users 100 --spawn-rate 10 --run-time 5m --headless \
           --html=load_test_report.html
"""

from locust import HttpUser, task, between, events
import random
import json
from datetime import datetime, timedelta


class GanitelUser(HttpUser):
    """Simulation d'un utilisateur Ganitel"""
    
    # Temps d'attente entre les tâches (en secondes)
    wait_time = between(1, 5)
    
    def on_start(self):
        """Exécuté au démarrage de chaque utilisateur"""
        self.token = None
        self.user_id = None
        self.services = []
        self.bookings = []
        
        # Tentative de connexion
        self.login()
    
    def login(self):
        """Connexion de l'utilisateur"""
        response = self.client.post(
            "/api/v1/auth/login",
            json={
                "identifier": f"loadtest{random.randint(1, 1000)}@example.com",
                "password": "password123"
            },
            name="Login"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            self.user_id = data.get("user_id")
    
    def get_headers(self):
        """Obtenir les headers d'authentification"""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    @task(10)
    def view_homepage(self):
        """Consulter la page d'accueil / health check"""
        self.client.get("/api/v1/health/", name="Homepage")
    
    @task(20)
    def search_services(self):
        """Rechercher des services"""
        cities = ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Limbé"]
        city = random.choice(cities)
        
        response = self.client.get(
            f"/api/v1/services/?city={city}&limit=20",
            name="Search Services"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.services = data.get("services", [])
    
    @task(15)
    def view_service_details(self):
        """Consulter les détails d'un service"""
        if self.services:
            service = random.choice(self.services)
            service_id = service.get("id")
            
            self.client.get(
                f"/api/v1/services/{service_id}",
                name="View Service Details"
            )
    
    @task(8)
    def list_services(self):
        """Lister tous les services"""
        self.client.get(
            "/api/v1/services/?limit=50",
            name="List Services"
        )
    
    @task(5)
    def create_booking(self):
        """Créer une réservation"""
        if not self.token or not self.services:
            return
        
        service = random.choice(self.services)
        start_date = datetime.now() + timedelta(days=random.randint(10, 60))
        end_date = start_date + timedelta(days=random.randint(2, 7))
        
        response = self.client.post(
            "/api/v1/bookings/",
            json={
                "service_id": service.get("id"),
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "guests": random.randint(1, 4),
                "notes": "Load test booking"
            },
            headers=self.get_headers(),
            name="Create Booking"
        )
        
        if response.status_code == 201:
            booking = response.json()
            self.bookings.append(booking)
    
    @task(7)
    def view_my_bookings(self):
        """Consulter mes réservations"""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/users/me/bookings",
            headers=self.get_headers(),
            name="View My Bookings"
        )
    
    @task(3)
    def initiate_payment(self):
        """Initier un paiement"""
        if not self.token or not self.bookings:
            return
        
        booking = random.choice(self.bookings)
        
        self.client.post(
            "/api/v1/payments/initiate",
            json={
                "booking_id": booking.get("id"),
                "payment_method": random.choice(["mtn", "orange"])
            },
            headers=self.get_headers(),
            name="Initiate Payment"
        )
    
    @task(4)
    def view_profile(self):
        """Consulter mon profil"""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/users/me",
            headers=self.get_headers(),
            name="View Profile"
        )
    
    @task(2)
    def filter_services_by_price(self):
        """Filtrer les services par prix"""
        min_price = random.choice([10000, 20000, 30000, 50000])
        max_price = min_price + random.randint(20000, 100000)
        
        self.client.get(
            f"/api/v1/services/?min_price={min_price}&max_price={max_price}&limit=20",
            name="Filter by Price"
        )
    
    @task(2)
    def filter_services_by_type(self):
        """Filtrer les services par type"""
        service_type = random.choice(["accommodation", "experience", "transport"])
        
        self.client.get(
            f"/api/v1/services/?service_type={service_type}&limit=20",
            name="Filter by Type"
        )


class ProviderUser(HttpUser):
    """Simulation d'un provider"""
    
    wait_time = between(2, 8)
    
    def on_start(self):
        """Exécuté au démarrage"""
        self.token = None
        self.provider_id = None
        self.my_services = []
        
        self.login_as_provider()
    
    def login_as_provider(self):
        """Connexion en tant que provider"""
        response = self.client.post(
            "/api/v1/auth/login",
            json={
                "identifier": f"provider{random.randint(1, 100)}@example.com",
                "password": "password123"
            },
            name="Provider Login"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            self.provider_id = data.get("user_id")
    
    def get_headers(self):
        """Obtenir les headers d'authentification"""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    @task(10)
    def view_my_services(self):
        """Consulter mes services"""
        if not self.token:
            return
        
        response = self.client.get(
            "/api/v1/providers/me/services",
            headers=self.get_headers(),
            name="View My Services"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.my_services = data.get("services", [])
    
    @task(5)
    def view_bookings_for_my_services(self):
        """Consulter les réservations de mes services"""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/providers/me/bookings",
            headers=self.get_headers(),
            name="View Service Bookings"
        )
    
    @task(3)
    def update_service(self):
        """Mettre à jour un service"""
        if not self.token or not self.my_services:
            return
        
        service = random.choice(self.my_services)
        
        self.client.put(
            f"/api/v1/services/{service.get('id')}",
            json={
                "title": f"Updated Service {random.randint(1, 1000)}",
                "base_price": random.randint(20000, 100000)
            },
            headers=self.get_headers(),
            name="Update Service"
        )
    
    @task(2)
    def create_service(self):
        """Créer un nouveau service"""
        if not self.token:
            return
        
        cities = ["Douala", "Yaoundé", "Bafoussam", "Garoua", "Limbé"]
        
        self.client.post(
            "/api/v1/services/",
            json={
                "title": f"Load Test Service {random.randint(1, 10000)}",
                "description": "Service créé pendant le test de charge",
                "service_type": "accommodation",
                "accommodation_type": random.choice(["hotel", "villa", "apartment"]),
                "country": "Cameroon",
                "city": random.choice(cities),
                "address": f"{random.randint(1, 999)} Test Street",
                "base_price": random.randint(20000, 150000),
                "currency": "XAF",
                "max_guests": random.randint(2, 10)
            },
            headers=self.get_headers(),
            name="Create Service"
        )
    
    @task(8)
    def view_dashboard(self):
        """Consulter le tableau de bord"""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/providers/me/dashboard",
            headers=self.get_headers(),
            name="Provider Dashboard"
        )


# Événements Locust pour statistiques personnalisées

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Exécuté au début du test"""
    print("🚀 Démarrage du test de charge Ganitel")
    print(f"   Host: {environment.host}")
    print(f"   Utilisateurs: {environment.runner.target_user_count if hasattr(environment.runner, 'target_user_count') else 'N/A'}")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Exécuté à la fin du test"""
    print("\n✅ Test de charge terminé")
    
    stats = environment.stats
    print(f"\n📊 Statistiques globales:")
    print(f"   Requêtes totales: {stats.total.num_requests}")
    print(f"   Échecs: {stats.total.num_failures}")
    print(f"   Taux d'échec: {stats.total.fail_ratio * 100:.2f}%")
    print(f"   Temps de réponse moyen: {stats.total.avg_response_time:.2f}ms")
    print(f"   Temps de réponse médian: {stats.total.median_response_time:.2f}ms")
    print(f"   95e percentile: {stats.total.get_response_time_percentile(0.95):.2f}ms")
    print(f"   99e percentile: {stats.total.get_response_time_percentile(0.99):.2f}ms")
    print(f"   Requêtes/seconde: {stats.total.total_rps:.2f}")


# Configuration des scénarios de test

# Scénario 1: Charge normale (80% travelers, 20% providers)
# locust -f locustfile.py --host=http://localhost:8000 \
#        --users 100 --spawn-rate 10 --run-time 10m

# Scénario 2: Pic de charge (test de stress)
# locust -f locustfile.py --host=http://localhost:8000 \
#        --users 500 --spawn-rate 50 --run-time 5m

# Scénario 3: Charge soutenue (test d'endurance)
# locust -f locustfile.py --host=http://localhost:8000 \
#        --users 200 --spawn-rate 20 --run-time 1h
