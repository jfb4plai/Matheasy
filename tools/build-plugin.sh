#!/usr/bin/env bash
# Fabrique dist/matheasy.plugin (ZIP avec config.json à la racine). Nécessite `zip`.
set -euo pipefail
cd "$(dirname "$0")/.."
# Tests avant fabrication : bloquants si Node.js est installé, sautés sinon
if command -v node >/dev/null 2>&1; then
  node tests/run-all.js || { echo "Tests en échec : le fichier .plugin n'a pas été fabriqué." >&2; exit 1; }
else
  echo "Attention : Node.js absent, tests non lancés, fabrication quand même." >&2
fi
mkdir -p dist
rm -f dist/matheasy.plugin
zip -qr dist/matheasy.plugin config.json index.html LICENSE LICENSE-CONTENT.md scripts styles corpus resources vendor
echo "OK : dist/matheasy.plugin"
