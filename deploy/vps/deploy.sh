#!/usr/bin/env bash
set -euo pipefail

repo_dir=/opt/ganitel/repo
stack_dir=/opt/ganitel

git -C "$repo_dir" fetch --quiet origin main
git -C "$repo_dir" reset --hard --quiet origin/main

caddyfile_before=$(md5sum "$stack_dir/Caddyfile")
cp "$repo_dir/docker-compose.yml" "$repo_dir/Caddyfile" "$stack_dir/"
caddyfile_after=$(md5sum "$stack_dir/Caddyfile")

cd "$stack_dir"
docker compose pull --quiet
docker compose up -d --remove-orphans

if [ "$caddyfile_before" != "$caddyfile_after" ]; then
  docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
fi

docker image prune -f >/dev/null
