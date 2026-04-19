# 🤝 Contributing to Ganitel Backend

Welcome to the Ganitel development team! This guide will help you contribute effectively to our backend codebase.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Coding Standards](#coding-standards)
4. [Git Flow & Branching](#git-flow--branching)
5. [Code Review Process](#code-review-process)
6. [Testing Guidelines](#testing-guidelines)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## 🚀 Getting Started

### **Prerequisites**
- Python 3.11+
- Git installed and configured
- VS Code (recommended) with Python extension
- Docker Desktop (for local database)
- Postman or similar API testing tool

### **Initial Setup**
1. **Clone the repository:**
   ```bash
   git clone https://github.com/hansou237/ganitel-backend.git
   cd ganitel-backend
   ```

2. **Set up your development environment:**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Configure your Git identity:**
   ```bash
   git config user.name "Your Name"
   git config user.email "your.email@company.com"
   ```

4. **Set up pre-commit hooks:**
   ```bash
   pre-commit install
   ```

---

## 🔄 Development Workflow

### **Our Branch Strategy**
We use a **simplified Git Flow** with three main branches:

```
main      ──────────────────────────────── (Production)
  │
dev       ──┬─────┬─────┬─────────────────── (Development)
            │     │     │
feature/    │     │     └─ feature/payment-integration
user-auth   │     │
            │     └─ feature/booking-system
            │
            └─ feature/service-management
```

### **Step-by-Step Workflow**

#### **1. Start a New Feature**
```bash
# 1. Switch to dev branch
git checkout dev

# 2. Pull latest changes
git pull origin dev

# 3. Create your feature branch
git checkout -b feature/your-feature-name

# Example:
git checkout -b feature/user-authentication
git checkout -b feature/booking-system
git checkout -b bugfix/payment-validation
```

#### **2. Work on Your Feature**
```bash
# Make your changes
# Follow coding standards (see below)

# Stage and commit changes
git add .
git commit -m "feat: add user authentication endpoint

- Implement JWT token generation
- Add password hashing
- Create login/logout endpoints
- Add input validation

Resolves: #123"
```

#### **3. Keep Your Branch Updated (Do This Daily!)**
```bash
# Fetch latest changes from dev
git fetch origin dev

# Rebase your feature branch on latest dev
git rebase origin/dev

# If there are conflicts, resolve them and continue
git rebase --continue

# Push your updated branch
git push origin feature/your-feature-name --force-with-lease
```

#### **4. Create Pull Request**
1. Push your branch to GitHub
2. Go to GitHub and create a Pull Request
3. Set **base branch** to `dev`
4. Fill out the PR template
5. Request review from team lead

---

## 📝 Coding Standards

### **File Organization**
Follow the exact structure from our architecture docs:
```
app/
├── models/          # Database models only
├── schemas/         # Pydantic schemas only  
├── services/        # Business logic only
├── api/            # API endpoints only
└── core/           # Configuration, auth, etc.
```

### **Naming Conventions**

#### **Files & Directories**
```python
# ✅ Good
user_service.py
booking_models.py
payment_schemas.py

# ❌ Bad
UserService.py
Booking-Models.py
paymentSchemas.py
```

#### **Classes**
```python
# ✅ Good
class UserService:
class BookingRequest:
class PaymentStatus:

# ❌ Bad
class userService:
class booking_request:
class PAYMENT_STATUS:
```

#### **Functions & Variables**
```python
# ✅ Good
def create_user():
def get_booking_by_id():
user_email = "test@example.com"

# ❌ Bad
def CreateUser():
def getBookingById():
UserEmail = "test@example.com"
```

#### **Constants**
```python
# ✅ Good
MAX_BOOKING_DURATION = 365
DEFAULT_CURRENCY = "XAF"
PAYMENT_STATUSES = ["pending", "completed", "failed"]

# ❌ Bad
max_booking_duration = 365
default_currency = "XAF"
```

### **Code Style Rules**

#### **1. Import Organization**
```python
# Standard library imports
import os
import sys
from datetime import datetime
from typing import Optional, List

# Third-party imports
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Local imports
from app.models.users import User
from app.services.auth import AuthService
from app.core.config import get_settings
```

#### **2. Function Documentation**
```python
def create_booking(
    booking_data: BookingCreate, 
    user_id: UUID, 
    db: Session
) -> Booking:
    """Create a new booking for a user.
    
    Args:
        booking_data: Booking creation data
        user_id: ID of the user making the booking
        db: Database session
        
    Returns:
        Created booking object
        
    Raises:
        ValidationError: If booking data is invalid
        NotFoundError: If service not found
    """
    # Implementation here
```

#### **3. Error Handling**
```python
# ✅ Good - Specific exceptions
try:
    booking = await booking_service.create_booking(data, user_id)
except ValidationError as e:
    raise HTTPException(status_code=400, detail=e.message)
except NotFoundError as e:
    raise HTTPException(status_code=404, detail=e.message)

# ❌ Bad - Generic exceptions
try:
    booking = await booking_service.create_booking(data, user_id)
except Exception as e:
    raise HTTPException(status_code=500, detail="Something went wrong")
```

#### **4. Database Queries**
```python
# ✅ Good - Use service layer
@router.get("/bookings/{booking_id}")
async def get_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    return await booking_service.get_booking_with_permissions(
        booking_id, current_user.id
    )

# ❌ Bad - Direct database access in endpoints
@router.get("/bookings/{booking_id}")
async def get_booking(
    booking_id: UUID,
    db: Session = Depends(get_db)
):
    return db.query(Booking).filter(Booking.id == booking_id).first()
```

### **Configuration Management**
```python
# ✅ Good - Use settings
from app.core.config import get_settings

settings = get_settings()
max_file_size = settings.MAX_UPLOAD_SIZE

# ❌ Bad - Hardcoded values
max_file_size = 10485760  # What does this number mean?
```

---

## 🌿 Git Flow & Branching

### **Branch Naming Convention**
```bash
# Features
feature/user-authentication
feature/booking-system
feature/payment-integration

# Bug fixes
bugfix/login-validation-error
bugfix/booking-date-calculation

# Hotfixes (urgent production fixes)
hotfix/payment-gateway-timeout

# Documentation
docs/api-documentation-update
docs/deployment-guide
```

### **Commit Message Format**
Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format:
<type>(<scope>): <description>

<body>

<footer>
```

#### **Commit Types**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

#### **Examples**
```bash
# ✅ Good commits
feat(auth): add JWT token validation middleware

fix(booking): resolve date calculation for multi-day bookings

docs(api): update booking endpoints documentation

refactor(services): extract common validation logic

test(users): add unit tests for user registration

# ❌ Bad commits
update stuff
fix bug
changes
WIP
```

### **Detailed Commit Example**
```bash
feat(booking): implement booking cancellation with refund calculation

- Add cancellation status to booking model
- Implement refund calculation based on cancellation policy
- Add cancellation reason tracking
- Send email notification on cancellation
- Update booking status workflow

Resolves: #245
Breaking Change: Updates booking status enum
```

### **Rebasing Your Branch (Daily Habit)**

**Why rebase?** Keeps your branch updated with the latest changes from `dev` and maintains a clean, linear history.

```bash
# 1. Fetch latest changes
git fetch origin

# 2. Rebase your feature branch
git checkout feature/your-feature-name
git rebase origin/dev

# 3. If conflicts occur:
# - VS Code will show conflicts in red
# - Resolve each conflict manually
# - Stage resolved files: git add <file>
# - Continue rebase: git rebase --continue

# 4. Force push your updated branch
git push origin feature/your-feature-name --force-with-lease
```

**⚠️ Important:** Only use `--force-with-lease` on your own feature branches, never on `main` or `dev`!

---

## 👀 Code Review Process

### **Before Creating a Pull Request**

#### **Self-Review Checklist**
```bash
# ✅ Before submitting your PR, check:
□ All tests pass locally
□ Code follows our style guide
□ No console.log() or print() statements left
□ No commented-out code
□ All imports are used
□ Function/class documentation is complete
□ Error handling is implemented
□ No hardcoded values (use config)
□ Branch is rebased on latest dev
```

#### **Run Pre-commit Checks**
```bash
# Format your code
black .
isort .

# Check for issues
flake8 .
mypy .

# Run tests
pytest
```

### **Pull Request Template**
When creating a PR, use this template:

```markdown
## 📝 Description
Brief description of what this PR does.

## 🎯 Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## 📋 Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works

## 🔗 Related Issues
Closes #123
```

### **Code Review Guidelines**

#### **For Review Authors (You)**
1. **Small PRs:** Keep PRs under 400 lines of changes
2. **Clear description:** Explain what and why, not just how
3. **Screenshots:** Include UI changes if applicable
4. **Tests:** Include relevant tests
5. **Documentation:** Update docs if needed

#### **For Reviewers**
Focus on these areas:
1. **Logic & Business Rules:** Does it solve the problem correctly?
2. **Security:** Are there any security vulnerabilities?
3. **Performance:** Are there obvious performance issues?
4. **Code Style:** Does it follow our conventions?
5. **Tests:** Are edge cases covered?

#### **Review Response Time**
- **Initial review:** Within 24 hours
- **Follow-up reviews:** Within 4 hours
- **Emergency fixes:** Within 1 hour

#### **Addressing Review Comments**
```bash
# 1. Make requested changes
# 2. Commit with descriptive message
git commit -m "review: address validation logic feedback

- Add email format validation
- Handle edge case for empty phone numbers
- Update error messages to be more descriptive"

# 3. Push changes
git push origin feature/your-feature-name

# 4. Reply to comments explaining your changes
```

### **Approval Process**
1. **Required approvals:** 1 team lead approval
2. **Auto-merge:** After approval + passing CI
3. **Deployment:** Automatic to staging, manual to production

---

## 🧪 Testing Guidelines

### **Testing Structure**
```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for services
├── api/           # API endpoint tests
└── fixtures/      # Test data and fixtures
```

### **Writing Tests**

#### **Unit Tests Example**
```python
# tests/unit/test_user_service.py
import pytest
from app.services.users import UserService
from app.schemas.users import UserCreate

def test_create_user_success():
    """Test successful user creation."""
    # Arrange
    user_data = UserCreate(
        whatsapp="+237677123456",
        first_name="John",
        last_name="Doe",
        email="john@example.com"
    )
    
    # Act
    user = await user_service.create_user(user_data)
    
    # Assert
    assert user.first_name == "John"
    assert user.whatsapp == "+237677123456"
    assert user.is_verified is False

def test_create_user_duplicate_whatsapp():
    """Test user creation with duplicate WhatsApp fails."""
    # Test implementation
```

#### **API Tests Example**
```python
# tests/api/test_booking_endpoints.py
def test_create_booking_success(client, auth_headers, sample_service):
    """Test successful booking creation."""
    booking_data = {
        "service_id": str(sample_service.id),
        "check_in_date": "2025-12-01T15:00:00",
        "check_out_date": "2025-12-03T11:00:00",
        "guest_count_adults": 2
    }
    
    response = client.post(
        "/api/v1/bookings/",
        json=booking_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["total_nights"] == 2
```

### **Running Tests**
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_user_service.py

# Run with coverage
pytest --cov=app tests/

# Run only failed tests
pytest --lf
```

---

## 🔧 Common Issues & Solutions

### **Git Issues**

#### **Merge Conflicts During Rebase**
```bash
# When you see conflicts during rebase:
# 1. Open VS Code - conflicts will be highlighted
# 2. Choose "Accept Current Change" or "Accept Incoming Change"
# 3. Or manually edit to combine both changes
# 4. Save the file
# 5. Stage the resolved file
git add <conflicted-file>

# 6. Continue the rebase
git rebase --continue

# 7. If more conflicts, repeat steps 1-6
# 8. When done, force push
git push origin feature/your-branch --force-with-lease
```

#### **Accidentally Committed to Wrong Branch**
```bash
# If you committed to dev instead of your feature branch:
# 1. Create your feature branch from current state
git checkout -b feature/my-feature

# 2. Go back to dev
git checkout dev

# 3. Reset dev to remove your commits
git reset --hard origin/dev

# 4. Go back to your feature branch
git checkout feature/my-feature
# Your commits are now on the correct branch!
```

#### **Need to Update Your Branch with Latest Dev**
```bash
# Daily routine:
git checkout dev
git pull origin dev
git checkout feature/your-branch
git rebase dev
git push origin feature/your-branch --force-with-lease
```

### **Development Issues**

#### **Database Changes Not Reflecting**
```bash
# 1. Create new migration
alembic revision --autogenerate -m "add new column"

# 2. Apply migration
alembic upgrade head

# 3. If issues, check your model definitions
```

#### **Import Errors**
```python
# ✅ Always use absolute imports from app root
from app.models.users import User
from app.services.booking import BookingService

# ❌ Avoid relative imports
from ..models.users import User
from .booking import BookingService
```

#### **Environment Issues**
```bash
# Reset your environment:
deactivate
rm -rf venv
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### **Code Review Issues**

#### **PR Too Large**
- **Split into smaller PRs:** Each PR should focus on one feature
- **Use draft PRs:** Create draft PR early to get feedback on approach

#### **Failing CI/CD**
```bash
# Before pushing, always run:
black .          # Format code
isort .          # Sort imports
flake8 .         # Check style
mypy .           # Type checking
pytest           # Run tests
```

---

## 🚀 Quick Reference

### **Daily Workflow**
```bash
# Morning routine:
git checkout dev
git pull origin dev
git checkout feature/your-branch
git rebase dev

# Work on your feature...

# Before committing:
black .
pytest
git add .
git commit -m "feat: meaningful commit message"

# End of day:
git push origin feature/your-branch
```

### **Common Commands**
```bash
# Switch branches
git checkout dev
git checkout feature/branch-name

# Create new branch
git checkout -b feature/new-feature

# Update your branch
git rebase origin/dev

# Push your branch
git push origin feature/branch-name

# Force push (after rebase)
git push origin feature/branch-name --force-with-lease
```

### **Getting Help**
1. **Check this guide first**
2. **Ask in team chat:** #dev-backend channel
3. **Schedule pair programming:** When stuck for >30 minutes
4. **Team lead review:** For architecture decisions

---

## 📞 Support

- **Technical questions:** @backend-lead in Slack
- **Git issues:** @devops-team in Slack  
- **Urgent issues:** Call team lead directly

**Remember:** It's better to ask questions early than to fix issues later! 🤝

---

*Happy coding! 🎉*