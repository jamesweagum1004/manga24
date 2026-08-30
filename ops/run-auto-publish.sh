#!/usr/bin/env bash
set -euo pipefail

cd /srv/manga24/app
set -a
. ./.env.production.local
set +a

curl --fail --silent --show-error \
  --request POST \
  --header "Authorization: Bearer ${N8N_IMPORT_API_KEY}" \
  http://127.0.0.1:3001/api/internal/auto-publish
