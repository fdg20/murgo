#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "==> MurGo backend: npm ci"
npm ci
echo "==> MurGo backend: npm run build"
npm run build
echo "==> MurGo backend: build complete"
