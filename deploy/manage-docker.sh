#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.yml"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Docker Compose was not found on this system."
  exit 1
fi

case "${1:-up}" in
  up)
    "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" up -d --build
    ;;
  down)
    "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" down
    ;;
  restart)
    "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" restart kant-os
    ;;
  logs)
    "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" logs -f kant-os
    ;;
  ps)
    "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" ps
    ;;
  *)
    echo "Usage: bash deploy/manage-docker.sh [up|down|restart|logs|ps]"
    exit 1
    ;;
esac
