# Ganitel Backend — multi-stage build with uv
FROM python:3.11-slim AS builder

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN uv venv && uv sync --no-dev --no-install-project --frozen

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    postgresql-client \
    curl \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.venv .venv
ENV PATH="/app/.venv/bin:$PATH"

COPY . .

RUN mkdir -p uploads logs

RUN useradd -m -u 1000 ganitel && chown -R ganitel:ganitel /app

USER root
RUN sed -i 's/\r$//' /app/scripts/entrypoint.sh && chmod +x /app/scripts/entrypoint.sh
USER ganitel

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/ || exit 1

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ─── Test ────────────────────────────────────────────────────────────────────
FROM runtime AS test

USER root
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml .
RUN uv sync --frozen
USER ganitel
