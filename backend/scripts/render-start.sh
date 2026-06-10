#!/bin/sh
set -e

worker_loop() {
  while true; do
    echo "VALEN worker: starting..."
    node dist/worker.js
    exit_code=$?
    echo "VALEN worker: exited with code ${exit_code}; restarting in 2s"
    sleep 2
  done
}

worker_loop &
WORKER_LOOP_PID=$!

cleanup() {
  if [ -n "$WORKER_LOOP_PID" ]; then
    kill "$WORKER_LOOP_PID" 2>/dev/null || true
    wait "$WORKER_LOOP_PID" 2>/dev/null || true
  fi
}

trap cleanup TERM INT

exec node dist/main.js
