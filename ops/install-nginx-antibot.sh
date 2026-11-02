#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-monitor}"
case "${MODE}" in
  monitor|enforce) ;;
  *) echo "Usage: $0 [monitor|enforce]" >&2; exit 2 ;;
esac

if [[ "${MODE}" == "enforce" && "${MANGA24_CLIENT_IP_VERIFIED:-}" != "1" ]]; then
  cat >&2 <<'EOF'
Refusing to enable blocking before the client IP is verified.
Confirm Nginx uses the real visitor IP (or that requests connect directly), then run:
  sudo env MANGA24_CLIENT_IP_VERIFIED=1 ./ops/install-nginx-antibot.sh enforce
Do not use raw X-Forwarded-For as a client IP source.
EOF
  exit 2
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="${SCRIPT_DIR}/nginx/manga24-antibot.conf"
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
  sed \
    -e 's/^limit_req_dry_run on;$/limit_req_dry_run off;/' \
    -e 's/^limit_conn_dry_run on;$/limit_conn_dry_run off;/' \
    "${SOURCE_FILE}" > "${TMP_FILE}"
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

sudo install -o root -g root -m 0644 "${TMP_FILE}" "${TARGET_FILE}"
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
echo "Nginx config validated and reloaded."
sudo systemctl is-active nginx
