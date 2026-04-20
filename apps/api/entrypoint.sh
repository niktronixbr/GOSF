#!/bin/sh
set -e

PRISMA_BIN="/app/packages/database/node_modules/.bin/prisma"
SCHEMA="/app/packages/database/prisma/schema.prisma"

echo ">>> [GOSF API] Aplicando migrations Prisma..."
"$PRISMA_BIN" migrate deploy --schema "$SCHEMA"

echo ">>> [GOSF API] Iniciando servidor..."
exec node dist/main
