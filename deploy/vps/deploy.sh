#!/usr/bin/env bash
set -euo pipefail

repo_dir=/opt/ganitel/repo
stack_dir=/opt/ganitel

git -C "$repo_dir" fetch --quiet origin main
git -C "$repo_dir" reset --hard --quiet origin/main

caddy_needs_reload=false
if [ -f "$stack_dir/Caddyfile" ] && ! cmp -s "$repo_dir/Caddyfile" "$stack_dir/Caddyfile"; then
  caddy_needs_reload=true
fi
cp "$repo_dir/docker-compose.yml" "$repo_dir/Caddyfile" "$stack_dir/"

cd "$stack_dir"
docker compose pull --quiet
docker compose up -d --remove-orphans

if [ "$caddy_needs_reload" = true ]; then
  docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
fi

docker image prune -f >/dev/null
