#!/bin/sh
set -e
node dist/src/worker.js &
exec node dist/src/main.js
