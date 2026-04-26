import os

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://ganitel:ganitel@localhost:15432/ganitel_test"
os.environ["REDIS_URL"] = "redis://localhost:6390/1"
os.environ["CORS_ORIGINS"] = ""
