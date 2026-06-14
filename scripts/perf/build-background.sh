#!/usr/bin/env bash
# Run VALEN builds in the background with log files under ./logs/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
mkdir -p logs

TARGET="${1:-all}"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H%M%SZ")"

run_bg() {
  local name="$1"
  shift
  local log="logs/${name}-build.log"
  local pidfile="logs/${name}-build.pid"
  local meta="logs/${name}-build.meta"

  if [[ -f "$pidfile" ]]; then
    local old_pid
    old_pid="$(cat "$pidfile")"
    if kill -0 "$old_pid" 2>/dev/null; then
      echo "[build-bg] ${name} already running (pid ${old_pid}). tail -f ${log}"
      return 0
    fi
  fi

  {
    echo "=== VALEN ${name} build started ${TIMESTAMP} ==="
    echo "cwd: ${ROOT}"
    echo "cmd: $*"
    echo "---"
  } >"$log"

  # nohup survives terminal close; disown for interactive shells
  nohup bash -lc "cd '$ROOT' && /usr/bin/time -f 'REAL_SECONDS=%e' $*" >>"$log" 2>&1 &
  local pid=$!
  echo "$pid" >"$pidfile"
  {
    echo "started=${TIMESTAMP}"
    echo "pid=${pid}"
    echo "log=${log}"
    echo "cmd=$*"
  } >"$meta"

  echo "[build-bg] ${name} started pid=${pid}"
  echo "[build-bg] tail -f ${log}"
}

case "$TARGET" in
  frontend)
    run_bg frontend "pnpm --filter frontend run build"
    ;;
  backend)
    run_bg backend "pnpm --filter backend run build"
    ;;
  all)
    run_bg frontend "pnpm --filter frontend run build"
    run_bg backend "pnpm --filter backend run build"
    ;;
  *)
    echo "Usage: $0 [frontend|backend|all]" >&2
    exit 1
    ;;
esac
