#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.yml"
PID_FILE="$ROOT_DIR/deploy/.kant-os.pid"
LOG_FILE="$ROOT_DIR/deploy/kant-os.log"
COMPOSE_CMD=()

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
fi

start_direct_server() {
  if [[ -f "$PID_FILE" ]]; then
    local existing_pid
    existing_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
      echo "KANT OS server is already running with PID $existing_pid."
      return 0
    fi
    rm -f "$PID_FILE"
  fi

  echo "Docker Compose not available; starting KANT OS server directly."
  nohup python3 "$ROOT_DIR/server/server.py" --host 0.0.0.0 --port 8420 >"$LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$PID_FILE"
  echo "KANT OS server started in background (PID $pid)."
  echo "Logs: $LOG_FILE"
}

stop_direct_server() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      sleep 1
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid"
      fi
    fi
    rm -f "$PID_FILE"
  fi
}

status_direct_server() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "KANT OS server is running (PID $pid)."
      echo "Logs: $LOG_FILE"
      return 0
    fi
  fi

  echo "KANT OS server is not running."
  return 1
}

logs_direct_server() {
  if [[ -f "$LOG_FILE" ]]; then
    tail -n 50 "$LOG_FILE"
  else
    echo "No logs available yet."
  fi
}

case "${1:-up}" in
  up)
    if ((${#COMPOSE_CMD[@]} > 0)); then
      "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" up -d --build
    else
      start_direct_server
    fi
    ;;
  down)
    if ((${#COMPOSE_CMD[@]} > 0)); then
      "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" down
    else
      stop_direct_server
    fi
    ;;
  restart)
    if ((${#COMPOSE_CMD[@]} > 0)); then
      "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" restart kant-os
    else
      stop_direct_server
      start_direct_server
    fi
    ;;
  logs)
    if ((${#COMPOSE_CMD[@]} > 0)); then
      "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" logs -f kant-os
    else
      logs_direct_server
    fi
    ;;
  ps)
    if ((${#COMPOSE_CMD[@]} > 0)); then
      "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" ps
    else
      status_direct_server
    fi
    ;;
  *)
    echo "Usage: bash deploy/manage-docker.sh [up|down|restart|logs|ps]"
    exit 1
    ;;
esac
