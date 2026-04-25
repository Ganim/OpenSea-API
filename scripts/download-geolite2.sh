#!/usr/bin/env bash
# Phase 9 / Plan 09-02 — Download MaxMind GeoLite2-City.mmdb
# Usage: MAXMIND_LICENSE_KEY=xxx MAXMIND_ACCOUNT_ID=yyy bash scripts/download-geolite2.sh
#
# License: This downloads MaxMind GeoLite2 database. The .mmdb file is gitignored
# (data/*.mmdb) — do NOT commit it. Free license at https://www.maxmind.com/en/geolite2/signup
set -euo pipefail

if [[ -z "${MAXMIND_LICENSE_KEY:-}" || -z "${MAXMIND_ACCOUNT_ID:-}" ]]; then
  echo "ERROR: MAXMIND_LICENSE_KEY and MAXMIND_ACCOUNT_ID env vars required."
  echo "Get them at https://www.maxmind.com/en/geolite2/signup"
  exit 1
fi

mkdir -p data
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo "[geolite2] Downloading GeoLite2-City..."
curl -L -u "${MAXMIND_ACCOUNT_ID}:${MAXMIND_LICENSE_KEY}" \
  "https://download.maxmind.com/geoip/databases/GeoLite2-City/download?suffix=tar.gz" \
  -o "$TMP_DIR/geolite2-city.tar.gz"

echo "[geolite2] Extracting..."
tar -xzf "$TMP_DIR/geolite2-city.tar.gz" -C "$TMP_DIR"
find "$TMP_DIR" -name "*.mmdb" -exec cp {} data/GeoLite2-City.mmdb \;

if [[ ! -f data/GeoLite2-City.mmdb ]]; then
  echo "ERROR: data/GeoLite2-City.mmdb not produced."
  exit 1
fi

ls -la data/GeoLite2-City.mmdb
echo "[geolite2] Done. File ready at data/GeoLite2-City.mmdb"
echo "[geolite2] Update monthly via cron: 0 3 1 * * MAXMIND_LICENSE_KEY=xxx MAXMIND_ACCOUNT_ID=yyy bash scripts/download-geolite2.sh"
