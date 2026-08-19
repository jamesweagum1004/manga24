#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="${SCRIPT_DIR}/nginx/manga24-upload.conf"
TARGET_FILE="/etc/nginx/conf.d/manga24-upload.conf"

if [[ ! -f "${SOURCE_FILE}" ]]; then
  echo "Missing nginx template: ${SOURCE_FILE}" >&2
  exit 1
fi

sudo install -o root -g root -m 0644 "${SOURCE_FILE}" "${TARGET_FILE}"

if ! sudo nginx -t; then
  echo "Nginx validation failed. Removing the new configuration." >&2
  sudo rm -f -- "${TARGET_FILE}"
  sudo nginx -t
  exit 1
fi

sudo systemctl reload nginx

echo "Installed ${TARGET_FILE}"
echo "Upload limit: 512 MB"
echo "Client/proxy timeout: 900 seconds"
sudo systemctl is-active nginx
