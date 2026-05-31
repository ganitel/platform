#!/usr/bin/env bash
# Dev orchestrator: starts backend + frontend, dies-together on signal or first-exit.
#
# Why this exists: Make's `dev` recipe inlined this and the macOS bash 3.2 +
# pipe-PGID lookup interactions made Ctrl+C unreliable (trap fired in the wrong
# process group, leaving uvicorn/vite orphaned). A standalone script lets us
# use bash 4+ features and a clean `kill 0` group teardown.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Color-free tags for the prefixed output.
FE='[frontend]'
BE='[backend] '

echo "Starting frontend + backend dev servers (Ctrl+C to stop)…"
echo "$BE  → FastAPI dev server: http://localhost:8000"
echo "$FE  → Vite dev server:    http://localhost:3000"

# Run each server as a backgrounded subshell. We pipe through sed for prefixed
# output. We capture the PID of the *subshell* (`$!` here is the subshell, not
# the sed at the end of the pipe, because the subshell is the foregrounded
# job and `&` backgrounds the whole pipeline).
{
  cd packages/backend && PYTHONUNBUFFERED=1 \
    uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1
} | sed -u -e "s/^/$BE /" &
BACKEND_PID=$!

{
  cd packages/frontend && bun run dev 2>&1
} | sed -u -e "s/^/$FE /" &
FRONTEND_PID=$!

# `kill 0` sends the signal to the entire process group of the current shell —
# this script + both subshells + their children (uvicorn, vite, etc.). That's
# what we want on Ctrl+C or when one server dies and we need to shut the other.
cleanup() {
  # Disable the trap so cleanup doesn't recurse.
  trap - INT TERM EXIT
  echo
  echo "[dev] stopping all dev servers..."
  # SIGTERM to the whole process group. The `|| true` swallows "no such process"
  # if children have already exited.
  kill 0 2>/dev/null || true
  # Give them a moment to clean up, then SIGKILL anything still around.
  sleep 1
  kill -9 0 2>/dev/null || true
}

trap cleanup INT TERM EXIT

# Poll: if either backgrounded subshell dies, exit so the trap (EXIT) kills the
# other. macOS bash 3.2 doesn't have `wait -n` so we poll once per second.
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

echo "[dev] one server exited — shutting the other down"
exit 1
