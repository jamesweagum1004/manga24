#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-monitor}"
case "${MODE}" in
  monitor|enforce) ;;
  *) echo "Usage: $0 [monitor|enforce]" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="${SCRIPT_DIR}/nginx/manga24-antibot.conf"
ENFORCE_TEMPLATE="${SCRIPT_DIR}/nginx/manga24-antibot-enforce.conf"
TARGET_FILE="/etc/nginx/conf.d/manga24-antibot.conf"
TMP_FILE="$(mktemp)"
BACKUP_FILE=""
cleanup() { rm -f -- "${TMP_FILE}"; }
trap cleanup EXIT

if [[ ! -f "${SOURCE_FILE}" ]]; then
  echo "Missing Nginx template: ${SOURCE_FILE}" >&2
  exit 1
fi

if [[ "${MODE}" == "monitor" ]]; then
  install -m 0644 "${SOURCE_FILE}" "${TMP_FILE}"
else
  if [[ ! -f "${ENFORCE_TEMPLATE}" ]]; then
    echo "Missing Nginx enforcement template: ${ENFORCE_TEMPLATE}" >&2
    exit 1
  fi
  cat <<'EOF'
Before enabling enforcement, configure Bunny Edge Rules on the Pull Zone serving
manga24.net and www.manga24.net to overwrite these origin request headers:
  X-Manga24-Client-IP = %{User.IP}
  X-Manga24-Origin-Key = a private random value (at least 43 URL-safe characters)

The origin key is entered invisibly below and stored only in the root-owned Nginx
configuration. The main site will return 403 for requests that bypass Bunny.
The direct.manga24.net n8n import endpoint is not affected.
EOF
  if [[ ! -t 0 ]]; then
    echo "Run enforcement interactively so the origin key can be entered safely." >&2
    exit 2
  fi
  read -r -s -p "Bunny origin key: " ORIGIN_KEY
  printf '\n'
  if [[ ! "${ORIGIN_KEY}" =~ ^[A-Za-z0-9_-]{43,128}$ ]]; then
    echo "Origin key must be 43-128 URL-safe characters (letters, digits, _ or -)." >&2
    exit 2
  fi
  sed "s|__MANGA24_ORIGIN_KEY__|${ORIGIN_KEY}|g" "${ENFORCE_TEMPLATE}" > "${TMP_FILE}"
  unset ORIGIN_KEY
fi

if sudo test -e "${TARGET_FILE}"; then
  BACKUP_FILE="${TARGET_FILE}.bak.$(date +%Y%m%d%H%M%S)"
  sudo cp -a "${TARGET_FILE}" "${BACKUP_FILE}"
fi

restore_previous() {
  if [[ -n "${BACKUP_FILE}" ]]; then
    sudo cp -a "${BACKUP_FILE}" "${TARGET_FILE}"
  else
    sudo rm -f -- "${TARGET_FILE}"
  fi
}

TARGET_MODE=0644
if [[ "${MODE}" == "enforce" ]]; then TARGET_MODE=0600; fi
sudo install -o root -g root -m "${TARGET_MODE}" "${TMP_FILE}" "${TARGET_FILE}"
if ! sudo nginx -t; then
  echo "Nginx validation failed; restoring the previous configuration." >&2
  restore_previous
  sudo nginx -t
  exit 1
fi

if ! sudo systemctl reload nginx; then
  echo "Nginx reload failed; restoring the previous configuration." >&2
  restore_previous
  sudo nginx -t
  sudo systemctl reload nginx
  exit 1
fi

echo "Installed ${MODE} mode: ${TARGET_FILE}"
if [[ "${MODE}" == "enforce" ]]; then
  echo "Direct-origin requests for manga24.net/www.manga24.net are gated; Bunny must inject both headers."
fi
echo "Nginx config validated and reloaded."
sudo systemctl is-active nginx
