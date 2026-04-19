# ✅ Ganitel V2 — CI/CD Strategy & DevOps Infrastructure

This document outlines the complete Continuous Integration and Continuous Deployment strategy for the Ganitel multi-service travel platform, ensuring reliable, secure, and scalable deployments.

---

## 🎯 CI/CD Philosophy & Goals

### **Core Principles**
- **Automated Everything**: From code commit to production deployment
- **Fast Feedback**: Quick identification and resolution of issues
- **Safety First**: Multiple validation gates before production
- **Zero Downtime**: Rolling deployments with health checks
- **Rollback Ready**: Instant rollback capability for any deployment

### **Key Objectives**
| Objective | Target | Measurement |
|-----------|--------|-------------|
| **Deployment Frequency** | Multiple times per day | Deployment count/day |
| **Lead Time** | <30 minutes (feature to production) | Time from commit to deploy |
| **Recovery Time** | <15 minutes | Time to restore service |
| **Change Failure Rate** | <5% | Failed deployments/total deployments |
| **Test Coverage** | >90% | Automated test coverage |

---

## 🏗️ Infrastructure Architecture

### **Cloud Infrastructure (AWS)**
```
Production Environment
┌─────────────────────────────────────────────────────────────┐
│                      AWS Production                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │     ALB     │  │  CloudFront │  │   Route 53  │         │
│  │ (Load Bal.) │  │    (CDN)    │  │    (DNS)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                 │                 │              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              ECS Fargate Cluster                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  API Tasks  │  │ Worker Tasks│  │ Admin Tasks │     │ │
│  │  │   (Auto    │  │   (Async    │  │  (Internal  │     │ │
│  │  │  Scaling)  │  │ Processing) │  │   Tools)    │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └─────────────────────────────────────────────────────────┘ │
│         │                 │                 │              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   RDS Prod  │  │   ElastiCache│  │     S3      │         │
│  │ (PostgreSQL)│  │   (Redis)   │  │  (Storage)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘

Staging Environment
┌─────────────────────────────────────────────────────────────┐
│                     AWS Staging                            │
├─────────────────────────────────────────────────────────────┤
│  Similar architecture but smaller scale                    │
│  - Single AZ deployment                                    │
│  - Smaller instance types                                  │
│  - Shared resources where possible                         │
└─────────────────────────────────────────────────────────────┘
```

### **Environment Strategy**
| Environment | Purpose | Infrastructure | Data | Deployment Trigger |
|-------------|---------|----------------|------|-------------------|
| **Development** | Feature development | Local Docker | Synthetic | Manual/Feature branch |
| **Staging** | Integration testing | AWS (scaled down) | Anonymized prod data | Automatic on develop |
| **Production** | Live system | AWS (full scale) | Real data | Automatic on main |

---

## 🔄 Git Workflow & Branching Strategy

### **GitFlow Strategy**
```
main (production-ready)
├── develop (integration branch)
│   ├── feature/user-authentication
│   ├── feature/payment-integration
│   ├── feature/booking-system
│   └── feature/provider-dashboard
├── release/v1.2.0 (release preparation)
├── hotfix/critical-payment-bug (emergency fixes)
└── support/v1.1.x (maintenance branches)
```

### **Branch Protection Rules**
```yaml
# .github/branch-protection.yml
main:
  required_status_checks:
    - unit-tests
    - integration-tests
    - security-scan
    - performance-tests
  required_pull_request_reviews: 2
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  restrict_pushes: true

develop:
  required_status_checks:
    - unit-tests
    - integration-tests
    - lint-check
  required_pull_request_reviews: 1
  dismiss_stale_reviews: false
```

### **Commit Convention**
```bash
# Conventional Commits format
<type>[optional scope]: <description>

feat(auth): add WhatsApp OTP authentication
fix(payment): resolve Tranzak webhook timeout issue
docs(api): update booking endpoints documentation
test(booking): add integration tests for cart flow
refactor(search): optimize service search performance
chore(deps): update FastAPI to version 0.104.1
```

---

## 🚀 CI/CD Pipeline Architecture

### **GitHub Actions Workflow**
```yaml
# .github/workflows/main.yml
name: Ganitel CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: ganitel-backend
  ECS_SERVICE: ganitel-api
  ECS_CLUSTER: ganitel-production

jobs:
  # Stage 1: Code Quality & Security
  code-quality:
    name: Code Quality Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements-dev.txt

      - name: Lint with flake8
        run: |
          flake8 app/ tests/ --count --select=E9,F63,F7,F82 --show-source --statistics
          flake8 app/ tests/ --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

      - name: Format check with black
        run: |
          black --check app/ tests/

      - name: Type check with mypy
        run: |
          mypy app/

      - name: Security scan with bandit
        run: |
          bandit -r app/ -f json -o bandit-report.json
          bandit -r app/ -ll

      - name: Dependency vulnerability scan
        run: |
          safety check --json --output safety-report.json
          safety check

  # Stage 2: Unit & Integration Tests
  test-suite:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: code-quality
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: ganitel_test
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: ganitel_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements-test.txt

      - name: Run database migrations
        env:
          DATABASE_URL: postgresql://ganitel_test:test_password@localhost:5432/ganitel_test
        run: |
          alembic upgrade head

      - name: Run unit tests
        env:
          DATABASE_URL: postgresql://ganitel_test:test_password@localhost:5432/ganitel_test
          REDIS_URL: redis://localhost:6379/0
        run: |
          pytest tests/unit/ -v --cov=app --cov-report=xml --cov-report=html --cov-fail-under=90

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://ganitel_test:test_password@localhost:5432/ganitel_test
          REDIS_URL: redis://localhost:6379/0
        run: |
          pytest tests/integration/ -v --maxfail=5

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          fail_ci_if_error: true

  # Stage 3: Security Testing
  security-tests:
    name: Security Testing
    runs-on: ubuntu-latest
    needs: code-quality
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run security tests
        run: |
          pip install -r requirements-test.txt
          pytest tests/security/ -v --tb=short

      - name: SAST with CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: python

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

      - name: Container security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ganitel-backend:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'

  # Stage 4: Build & Push Images
  build-and-push:
    name: Build and Push Docker Images
    runs-on: ubuntu-latest
    needs: [test-suite, security-tests]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Stage 5: Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
      - name: Deploy to ECS Staging
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: .aws/task-definition-staging.json
          service: ganitel-api-staging
          cluster: ganitel-staging
          wait-for-service-stability: true

      - name: Run E2E tests against staging
        run: |
          pip install playwright pytest-playwright
          playwright install chromium
          pytest tests/e2e/ --base-url=https://staging.ganitel.com --browser chromium

      - name: Performance test staging
        run: |
          pip install locust
          locust -f tests/performance/locustfile.py --headless \
                 --users 50 --spawn-rate 5 --run-time 3m \
                 --host https://staging.ganitel.com

  # Stage 6: Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build-and-push, deploy-staging]
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition ganitel-api \
            --query taskDefinition > task-definition.json

      - name: Update task definition with new image
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ganitel-api
          image: ${{ needs.build-and-push.outputs.image-tag }}

      - name: Deploy to ECS Production
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

      - name: Verify deployment health
        run: |
          chmod +x ./.aws/health-check.sh
          ./.aws/health-check.sh https://api.ganitel.com/health

      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          text: "🚀 Ganitel backend deployed successfully to production!"

  # Stage 7: Post-Deployment Monitoring
  post-deployment:
    name: Post-Deployment Monitoring
    runs-on: ubuntu-latest
    needs: deploy-production
    if: always()
    
    steps:
      - name: Run smoke tests
        run: |
          pytest tests/smoke/ --base-url=https://api.ganitel.com -v

      - name: Update deployment tracking
        run: |
          curl -X POST "${{ secrets.DEPLOYMENT_TRACKER_URL }}" \
            -H "Content-Type: application/json" \
            -d '{
              "service": "ganitel-backend",
              "version": "${{ github.sha }}",
              "environment": "production",
              "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
              "status": "success"
            }'
```

---

## 🐳 Docker Configuration

### **Multi-stage Dockerfile**
```dockerfile
# Dockerfile
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Development stage
FROM base as development

WORKDIR /app

COPY requirements-dev.txt .
RUN pip install -r requirements-dev.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Test stage
FROM development as test

COPY requirements-test.txt .
RUN pip install -r requirements-test.txt

# Run tests
RUN pytest tests/ -v --cov=app --cov-report=html --cov-fail-under=90

# Production stage
FROM base as production

# Create non-root user
RUN groupadd -r ganitel && useradd -r -g ganitel ganitel

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Change ownership to non-root user
RUN chown -R ganitel:ganitel /app
USER ganitel

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### **Docker Compose for Development**
```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: .
      target: development
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://ganitel:password@db:5432/ganitel_dev
      - REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT=development
    volumes:
      - .:/app
      - /app/__pycache__
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: ganitel
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ganitel_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## ☁️ AWS Infrastructure as Code

### **Terraform Configuration**
```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "ganitel-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Ganitel"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "ganitel-${var.environment}"
  cidr = var.vpc_cidr
  
  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ganitel-${var.environment}"
  
  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      
      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs.name
      }
    }
  }
}

# ECS Service
resource "aws_ecs_service" "api" {
  name            = "ganitel-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  
  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 1
  }
  
  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets         = module.vpc.private_subnets
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "ganitel-api"
    container_port   = 8000
  }
  
  depends_on = [aws_lb_listener.api]
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier = "ganitel-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  
  db_name  = "ganitel"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"
  
  skip_final_snapshot = var.environment != "production"
  deletion_protection = var.environment == "production"
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "ganitel-${var.environment}"
  description                = "Redis cluster for Ganitel"
  
  node_type            = var.redis_node_type
  port                 = 6379
  parameter_group_name = "default.redis7"
  
  num_cache_clusters = var.redis_num_cache_nodes
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  automatic_failover_enabled = var.environment == "production"
}
```

### **ECS Task Definition**
```json
{
  "family": "ganitel-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "ganitel-api",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/ganitel-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:ganitel/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:ganitel/redis-url"
        },
        {
          "name": "JWT_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:ganitel/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ganitel-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8000/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

---

## 📊 Monitoring & Observability

### **Application Monitoring**
```python
# app/middleware/monitoring.py
import time
import uuid
from typing import Callable
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, Gauge
import structlog

# Prometheus Metrics
REQUEST_COUNT = Counter(
    'ganitel_http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'ganitel_http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'ganitel_active_connections',
    'Number of active connections'
)

BOOKING_OPERATIONS = Counter(
    'ganitel_booking_operations_total',
    'Total number of booking operations',
    ['operation', 'status']
)

logger = structlog.get_logger()

class MonitoringMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        ACTIVE_CONNECTIONS.inc()
        
        try:
            # Process request
            response = await self.app(scope, receive, send)
            
            # Record metrics
            duration = time.time() - start_time
            method = request.method
            endpoint = request.url.path
            status_code = getattr(response, 'status_code', 200)
            
            REQUEST_COUNT.labels(
                method=method,
                endpoint=endpoint,
                status_code=status_code
            ).inc()
            
            REQUEST_DURATION.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            # Structured logging
            logger.info(
                "HTTP request completed",
                request_id=request_id,
                method=method,
                endpoint=endpoint,
                status_code=status_code,
                duration=duration,
                user_agent=request.headers.get("user-agent"),
                client_ip=request.client.host
            )
            
        except Exception as e:
            logger.error(
                "HTTP request failed",
                request_id=request_id,
                method=request.method,
                endpoint=request.url.path,
                error=str(e),
                exc_info=True
            )
            raise
        
        finally:
            ACTIVE_CONNECTIONS.dec()
```

### **Health Check Endpoints**
```python
# app/api/health.py
from fastapi import APIRouter, HTTPException
from app.database import get_db_session
from app.cache import get_redis_client
import asyncio
import time

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0"
    }

@router.get("/health/detailed")
async def detailed_health_check():
    """Comprehensive health check with dependency verification"""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "checks": {}
    }
    
    # Database connectivity
    try:
        async with get_db_session() as session:
            result = await session.execute("SELECT 1")
            health_status["checks"]["database"] = {
                "status": "healthy",
                "response_time": time.time()
            }
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"
    
    # Redis connectivity
    try:
        redis_client = await get_redis_client()
        await redis_client.ping()
        health_status["checks"]["redis"] = {
            "status": "healthy",
            "response_time": time.time()
        }
    except Exception as e:
        health_status["checks"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"
    
    # External services
    external_services = ["tranzak", "twilio"]
    for service in external_services:
        try:
            # Implement actual health checks for external services
            health_status["checks"][service] = {
                "status": "healthy",
                "response_time": time.time()
            }
        except Exception as e:
            health_status["checks"][service] = {
                "status": "unhealthy",
                "error": str(e)
            }
    
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status

@router.get("/metrics")
async def prometheus_metrics():
    """Prometheus metrics endpoint"""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
```

### **CloudWatch Dashboards**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "ganitel-api"],
          [".", "MemoryUtilization", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Resource Utilization"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "ganitel-alb"],
          [".", "TargetResponseTime", ".", "."],
          [".", "HTTPCode_Target_2XX_Count", ".", "."],
          [".", "HTTPCode_Target_4XX_Count", ".", "."],
          [".", "HTTPCode_Target_5XX_Count", ".", "."]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Load Balancer Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "ganitel-production"],
          [".", "CPUUtilization", ".", "."],
          [".", "ReadLatency", ".", "."],
          [".", "WriteLatency", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Database Performance"
      }
    }
  ]
}
```

---

## 🚨 Alerting & Incident Response

### **CloudWatch Alarms**
```yaml
# cloudwatch-alarms.yml
alarms:
  - name: "High-CPU-Utilization"
    metric: "AWS/ECS"
    dimension: "ServiceName=ganitel-api"
    statistic: "Average"
    threshold: 80
    comparison: "GreaterThanThreshold"
    evaluation_periods: 2
    period: 300
    actions:
      - "arn:aws:sns:us-east-1:ACCOUNT:ganitel-alerts"

  - name: "High-Response-Time"
    metric: "AWS/ApplicationELB"
    dimension: "LoadBalancer=ganitel-alb"
    statistic: "Average"
    threshold: 2000  # 2 seconds
    comparison: "GreaterThanThreshold"
    evaluation_periods: 3
    period: 300
    actions:
      - "arn:aws:sns:us-east-1:ACCOUNT:ganitel-alerts"

  - name: "Database-Connection-Count"
    metric: "AWS/RDS"
    dimension: "DBInstanceIdentifier=ganitel-production"
    statistic: "Average"
    threshold: 80
    comparison: "GreaterThanThreshold"
    evaluation_periods: 2
    period: 300
    actions:
      - "arn:aws:sns:us-east-1:ACCOUNT:ganitel-alerts"

  - name: "Error-Rate-High"
    metric: "AWS/ApplicationELB"
    dimension: "LoadBalancer=ganitel-alb"
    statistic: "Sum"
    threshold: 10
    comparison: "GreaterThanThreshold"
    evaluation_periods: 2
    period: 300
    actions:
      - "arn:aws:sns:us-east-1:ACCOUNT:ganitel-critical-alerts"
```

### **Incident Response Runbooks**
```markdown
# Incident Response Runbooks

## 🚨 Critical Service Down

### Immediate Actions (0-5 minutes)
1. **Acknowledge Alert**: Confirm receipt in PagerDuty/Slack
2. **Check Status Page**: Update status.ganitel.com
3. **Initial Assessment**: 
   - Check CloudWatch metrics
   - Review recent deployments
   - Check ECS service status

### Investigation (5-15 minutes)
1. **Health Check**: `curl https://api.ganitel.com/health`
2. **Logs Review**: Check CloudWatch logs for errors
3. **Database Status**: Verify RDS connectivity
4. **External Dependencies**: Check Tranzak, Twilio status

### Resolution Actions
- **Service Restart**: Restart ECS service if healthy checks fail
- **Rollback**: Revert to previous deployment if recent deployment caused issue
- **Scale Up**: Increase task count if resource exhaustion
- **Failover**: Switch to backup region if primary region down

## 📈 High Response Time

### Investigation Steps
1. **CPU/Memory Check**: Review ECS resource utilization
2. **Database Performance**: Check RDS slow query logs
3. **External API Latency**: Monitor third-party service response times
4. **Load Balancer**: Check ALB target health

### Mitigation Actions
- **Auto Scaling**: Trigger immediate scale-up
- **Database Optimization**: Enable connection pooling
- **Cache Warming**: Pre-populate Redis cache
- **Circuit Breaker**: Enable for slow external APIs

## 💳 Payment Processing Issues

### Critical Payment Failure Response
1. **Immediate**: Disable payment processing if >20% failure rate
2. **Investigate**: Check Tranzak webhook delivery
3. **Manual Processing**: Enable manual payment verification
4. **Communication**: Notify affected users via WhatsApp
```

---

## 🔄 Rollback Strategies

### **Blue-Green Deployment**
```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -e

CLUSTER_NAME="ganitel-production"
SERVICE_NAME="ganitel-api"
NEW_TASK_DEFINITION=$1

echo "Starting Blue-Green deployment..."

# Get current task definition
CURRENT_TASK_DEF=$(aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --query 'services[0].taskDefinition' \
  --output text)

echo "Current task definition: $CURRENT_TASK_DEF"
echo "New task definition: $NEW_TASK_DEFINITION"

# Update service with new task definition
echo "Deploying new version..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $NEW_TASK_DEFINITION

# Wait for deployment to complete
echo "Waiting for deployment to stabilize..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME

# Health check
echo "Performing health check..."
if curl -f https://api.ganitel.com/health; then
  echo "✅ Deployment successful!"
  
  # Update deployment tracking
  echo "Recording successful deployment..."
  # Your deployment tracking logic here
  
else
  echo "❌ Health check failed! Rolling back..."
  
  # Rollback to previous task definition
  aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $CURRENT_TASK_DEF
  
  aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME
  
  echo "Rollback completed."
  exit 1
fi
```

### **Database Migration Rollback**
```python
# scripts/rollback_migration.py
import asyncio
import sys
from alembic import command
from alembic.config import Config
from app.database import get_db_session

async def rollback_migration(revision: str = None):
    """Rollback database migration with safety checks"""
    
    # Create backup before rollback
    print("Creating database backup...")
    backup_name = f"ganitel_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # AWS RDS snapshot
    subprocess.run([
        "aws", "rds", "create-db-snapshot",
        "--db-instance-identifier", "ganitel-production",
        "--db-snapshot-identifier", backup_name
    ], check=True)
    
    print(f"Backup created: {backup_name}")
    
    # Perform rollback
    print(f"Rolling back to revision: {revision or 'previous'}")
    
    config = Config("alembic.ini")
    
    if revision:
        command.downgrade(config, revision)
    else:
        command.downgrade(config, "-1")  # Previous revision
    
    print("Migration rollback completed!")
    
    # Verify application health
    async with get_db_session() as session:
        result = await session.execute("SELECT 1")
        if result.fetchone():
            print("✅ Database connectivity verified")
        else:
            print("❌ Database connectivity failed")
            sys.exit(1)

if __name__ == "__main__":
    revision = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(rollback_migration(revision))
```

---

## 📈 Performance Optimization

### **Auto Scaling Configuration**
```json
{
  "ServiceName": "ganitel-api",
  "ScalableDimension": "ecs:service:DesiredCount",
  "MinCapacity": 2,
  "MaxCapacity": 20,
  "TargetTrackingScalingPolicies": [
    {
      "MetricType": "ECSServiceAverageCPUUtilization",
      "TargetValue": 70.0,
      "ScaleOutCooldown": 300,
      "ScaleInCooldown": 600
    },
    {
      "MetricType": "ECSServiceAverageMemoryUtilization", 
      "TargetValue": 80.0,
      "ScaleOutCooldown": 300,
      "ScaleInCooldown": 600
    },
    {
      "MetricType": "ALBRequestCountPerTarget",
      "TargetValue": 1000,
      "ScaleOutCooldown": 180,
      "ScaleInCooldown": 300
    }
  ],
  "StepScalingPolicies": [
    {
      "PolicyName": "Emergency-Scale-Out",
      "MetricIntervalLowerBound": 90.0,
      "ScalingAdjustment": 5,
      "AdjustmentType": "ChangeInCapacity"
    }
  ]
}
```

This comprehensive CI/CD strategy ensures reliable, secure, and scalable deployments for the Ganitel platform, with robust monitoring, alerting, and rollback capabilities to maintain high availability and performance.