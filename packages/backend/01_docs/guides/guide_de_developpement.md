---

# 🧭 GUIDE DE DÉVELOPPEMENT D’ÉQUIPE

---

## 🎯 Objectif

Ce guide explique **comment transformer la conception logicielle** en un **développement structuré, collaboratif et efficace**.
Il précise **le lien direct entre la phase de conception et la phase de production de code**, afin que toute l’équipe reste alignée sur la même vision technique.

L’objectif est d’éviter :

* Les empiètements entre développeurs.
* Les incohérences entre architecture pensée et architecture codée.
* Les lenteurs dues aux dépendances mal gérées.

---

# 🧩 1. De la conception au développement

### 1.1 Principe fondamental

La conception donne la **carte**, le développement trace la **route**.
Chaque livrable de conception doit se traduire en tâches concrètes de développement.

**Correspondances :**

* **Cas d’utilisation** → Use Cases (dans `application/use_cases/`)
* **Modèle de domaine** → Entités et interfaces (`domain/models/`, `domain/repositories/`)
* **Architecture logicielle** → Structure des dossiers du projet (`app/`)
* **Diagrammes de séquence** → Endpoints et services (`interface/api/`)
* **Modèle de base de données** → ORM et migrations (`infrastructure/database/`)
* **ADR** → Décisions à respecter dans le code (pas à rediscuter)

👉 Le code **n’invente rien**, il **implémente ce qui a été conçu**.

---

# ⚙️ 2. Développer selon l’architecture hexagonale (Clean Architecture)

### 2.1 Objectif

L’architecture hexagonale sépare :

* le **cœur métier** (logique pure, indépendante),
* les **interfaces externes** (API, BDD, services tiers),
* et les **ports d’entrée/sortie** (use cases et adaptateurs).

C’est ce découpage qui **permet le travail parallèle** sans conflits.

---

### 2.2 Structure du projet

```
app/
 ├── domain/              # Cœur métier
 │   ├── models/          # Entités métiers (Booking, Listing, etc.)
 │   ├── repositories/    # Interfaces abstraites
 │   └── services/        # Logique métier pure
 │
 ├── application/         # Cas d’usage
 │   └── use_cases/       # Ex: create_booking.py
 │
 ├── infrastructure/      # Couches techniques
 │   ├── database/        # ORM, migrations
 │   ├── external_apis/   # Services externes (Tranzak, WhatsApp)
 │   └── repositories/    # Implémentations concrètes
 │
 └── interface/           # Interface utilisateur ou API
     ├── api/             # Routes FastAPI
     └── schemas/         # Schémas Pydantic
```

Chaque couche est **autonome** et **testable isolément**.
Personne ne code directement dans une autre couche sans passer par les interfaces.

---

### 2.3 Exemple de passage conception → code

**Conception :**

* Use Case : “Créer une réservation”.
* Diagramme de séquence : POST /bookings → crée Booking → lance paiement.
* Domain Model : Booking, Listing, Payment.

**Code :**

```
/domain/models/booking.py
/domain/repositories/booking_repository.py
/application/use_cases/create_booking.py
/infrastructure/repositories/booking_repository_sql.py
/interface/api/bookings.py
```

---

# 🧠 3. Découper les tâches à partir de la conception

### 3.1 Le rôle du Lead Dev

Le Lead Dev traduit la conception en **backlog de tâches** (issues GitHub, cartes Kanban).
Chaque **grande fonctionnalité** devient une **Epic**, divisée en tâches atomiques.

Exemple :

> Epic : Réservations
>
> * Créer le modèle `Booking`.
> * Implémenter `BookingRepository`.
> * Écrire le use case `CreateBooking`.
> * Créer le endpoint `POST /bookings`.
> * Tester le flux complet.

Chaque tâche doit :

* être **autonome** et testable seule,
* dépendre d’un **contrat clair**,
* avoir un **critère de validation objectif**.

---

# 🔗 4. Définir les contrats pour éviter l’empiètement

### 4.1 Pourquoi les contrats

Les contrats sont les **accords formels entre modules** :
ils définissent *ce qu’un module fournit* et *ce qu’il attend*.

Chaque module code **contre une interface**, pas contre une implémentation.
C’est ce qui permet à plusieurs devs de travailler en parallèle.

---

### 4.2 Exemple de contrat interne

`/docs/contracts/listings_contract.md`

````md
# Contrat ListingService

## Méthode : get_available_listings(city, start_date, end_date)
Entrées :
- city: str
- start_date: date
- end_date: date

Sortie :
```json
[
  {"id": 1, "title": "Studio Douala", "price": 15000},
  {"id": 2, "title": "Villa Yaoundé", "price": 20000}
]
````

Exceptions :

* 404 si aucune annonce
* 500 si erreur externe

```

Tant que la signature est respectée, le code peut être développé séparément.

---

# 🧩 5. Répartition des zones de responsabilité

Le Lead Dev définit **des zones techniques indépendantes** :

- **Auth / Users** → Dev 1  
- **Listings** → Dev 2  
- **Bookings / Payments** → Dev 3  
- **Notifications (WhatsApp)** → Dev 4  
- **DevOps / CI / Supabase** → Dev 5

Chaque dev travaille sur **sa couche** sans modifier le code d’un autre module.  
Les échanges se font uniquement via **contrats documentés**.

---

# 🗂️ 6. Kanban (GitHub Projects)

### Colonnes standard :
```

📋 Backlog → 🧩 Ready → 🚧 In Progress → 🔍 Review → ✅ Done

```

### Règles :
- Une carte = une tâche indépendante.  
- Une branche Git = une carte.  
- Une PR = une carte + validation.  
- Aucune fusion sans review ni tests.  
- Le Kanban = la *source de vérité* du sprint.

---

# 🔄 7. Workflow Git et intégration continue

### Branches :
```

main       → production stable
develop    → intégration continue
feature/x  → développement d’une feature
fix/y      → correction ponctuelle

```

### Étapes :
1. Créer `feature/x` depuis `develop`.  
2. Coder + documenter.  
3. Commits clairs :  
```

feat(bookings): add POST /bookings endpoint

````
4. PR + tests automatiques (CI).  
5. Review + merge vers `develop`.  
6. Déploiement staging.

### Diagramme :
```mermaid
flowchart TD
 Dev["Push feature/x"] --> CI["Tests automatiques"]
 CI --> Review["Code review"]
 Review --> Merge["Merge vers develop"]
 Merge --> Deploy["Déploiement staging"]
````

---

# 🧠 8. Communication & collaboration

### En cas de blocage :

1. Chercher par soi-même (docs, Stack Overflow, logs).
2. Demander à un autre dev via Discord / Slack.
3. Si besoin, consulter le Lead Dev.
4. Utiliser l’IA (ChatGPT, Copilot…) pour accélérer la recherche.

> “L’IA aide à comprendre, mais la conception reste la boussole.”

Après résolution → documenter dans `/docs/troubleshooting/`.

---

# 🔍 9. Rituels d’équipe

* **Sprint Planning (début de sprint)** → définition des tâches.
* **Daily Stand-up (5–10 min)** → avancement / blocage / objectif.
* **Code Review (mi-sprint)** → validation technique.
* **Sprint Review (fin)** → démo.
* **Rétrospective** → ajustement du processus.

---

# ✅ 10. Règles d’or

1. Toujours partir de la **conception**.
2. Respecter l’**architecture hexagonale**.
3. Découper les tâches de façon **atomique et isolée**.
4. Établir des **contrats clairs** avant d’interagir entre modules.
5. Communiquer dès qu’un blocage survient.
6. Utiliser le Kanban et les PR comme **canal unique de suivi**.
7. Documenter tout problème et toute solution.

---

# 🧰 SECTION FINALE — MODÈLES PRATIQUES

## 🧩 Modèle 1 — Carte Kanban (GitHub Issue)

```md
### 🎯 Objectif
Décrire la tâche à développer.

### 🔗 Dépendances
- Dépend de : [Nom du module ou PR]
- Contrat : [Lien vers /docs/contracts/nom_du_contrat.md]

### ✅ Critères d’acceptation
- [ ] Fonctionnalité opérationnelle
- [ ] Tests unitaires passants
- [ ] Documentation mise à jour

### 💡 Notes techniques
(Liens vers ADR, schémas, diagrammes)
```

---

## ⚙️ Modèle 2 — Pull Request

```md
## 🔥 Description
Explique la fonctionnalité implémentée.

## 🧩 Lien Kanban
Issue #123

## 🧠 Changements apportés
- Nouveau module : booking_repository_sql.py
- Endpoint ajouté : /bookings
- Tests : test_booking.py

## ✅ Checklist
- [ ] Lint / Tests OK
- [ ] Documentation mise à jour
- [ ] Revue validée
- [ ] Aucun conflit
```

---

## 🧾 Modèle 3 — Contrat inter-module

````md
# Contrat [Nom du service]

## Méthode / Endpoint
Nom de la méthode ou route.

## Entrées
- nom : type — description

## Sorties
```json
{ "clé": "valeur" }
````

## Exceptions

* 400 : entrée invalide
* 404 : ressource non trouvée
* 500 : erreur serveur

```

---

## 💻 Modèle 4 — Squelette d’un module (architecture hexagonale)
```

app/
├── domain/
│   ├── models/
│   │   └── example.py
│   ├── repositories/
│   │   └── example_repository.py
│   └── services/
│       └── example_service.py
│
├── application/
│   └── use_cases/
│       └── example_use_case.py
│
├── infrastructure/
│   ├── repositories/
│   │   └── example_repository_sql.py
│   ├── database/
│   │   └── connection.py
│   └── external_apis/
│       └── provider_client.py
│
└── interface/
├── api/
│   └── example_routes.py
└── schemas/
└── example_schema.py

````

---

## 📅 Modèle 5 — Sprint Planning
```md
# Sprint [Numéro]
**Durée :** [dates]  
**Objectif :** [objectif principal]

## 🧱 Tâches planifiées
- [ ] Authentification JWT
- [ ] Endpoint /bookings
- [ ] Intégration Tranzak
- [ ] Notifications WhatsApp

## 👥 Répartition
- Dev 1 : Auth / Users
- Dev 2 : Bookings
- Dev 3 : Payments
- Dev 4 : Notifications
````

---

## 🧠 Modèle 6 — Exemple minimal de code (Hexagonal)

```python
# domain/models/booking.py
from dataclasses import dataclass

@dataclass
class Booking:
    id: int | None
    user_id: int
    listing_id: int
    status: str = "pending"
```

```python
# domain/repositories/booking_repository.py
from typing import Protocol
from app.domain.models.booking import Booking

class BookingRepository(Protocol):
    def save(self, booking: Booking) -> Booking: ...
```

```python
# application/use_cases/create_booking.py
from app.domain.models.booking import Booking
from app.domain.repositories.booking_repository import BookingRepository

class CreateBooking:
    def __init__(self, repo: BookingRepository):
        self.repo = repo
    def execute(self, data: dict) -> Booking:
        booking = Booking(**data)
        return self.repo.save(booking)
```

```python
# interface/api/bookings.py
from fastapi import APIRouter
from app.application.use_cases.create_booking import CreateBooking
from app.infrastructure.repositories.booking_repository_sql import BookingRepositorySQL

router = APIRouter()

@router.post("/bookings")
def create_booking(payload: dict):
    use_case = CreateBooking(BookingRepositorySQL())
    return use_case.execute(payload)
```

---

# ✅ CONCLUSION

Le développement d’équipe efficace repose sur trois piliers :

1. **Continuité avec la conception** (aucune improvisation).
2. **Respect strict de l’architecture** (isolation, contrats, modularité).
3. **Organisation fluide** (Kanban, branches Git, reviews, entraide).

Une équipe qui suit ce guide peut coder **vite, proprement, et sans friction**, même à distance.

---
