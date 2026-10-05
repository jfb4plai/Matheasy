#!/usr/bin/env bash
# Fabrique dist/matheasy.plugin (ZIP avec config.json à la racine). Nécessite `zip`.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
rm -f dist/matheasy.plugin
zip -qr dist/matheasy.plugin config.json index.html LICENSE LICENSE-CONTENT.md scripts styles corpus resources
echo "OK : dist/matheasy.plugin"
