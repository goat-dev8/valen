#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

for name in frontend backend; do
  pidfile="logs/${name}-build.pid"
  log="logs/${name}-build.log"
  if [[ -f "$pidfile" ]]; then
    pid="$(cat "$pidfile")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "${name}: RUNNING pid=${pid} (tail -f ${log})"
    else
      echo "${name}: DONE (see ${log})"
    fi
  else
    echo "${name}: no background build recorded"
  fi
done
