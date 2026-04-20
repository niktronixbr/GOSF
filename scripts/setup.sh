#!/bin/bash
set -e

echo "=== GOSF Setup ==="

# 1. Copiar .env
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✓ .env criado a partir de .env.example"
fi

if [ ! -f "apps/web/.env.local" ]; then
  cp apps/web/.env.local.example apps/web/.env.local
  echo "✓ apps/web/.env.local criado"
fi

if [ ! -f "apps/api/.env" ]; then
  cp apps/api/.env.example apps/api/.env
  echo "✓ apps/api/.env criado"
fi

# 2. Instalar dependências
echo "→ Instalando dependências..."
pnpm install

# 3. Docker
echo "→ Subindo Docker (PostgreSQL + Redis)..."
docker compose up -d
echo "→ Aguardando banco de dados..."
sleep 5

# 4. Prisma
echo "→ Gerando client Prisma..."
pnpm db:generate

echo "→ Aplicando schema no banco..."
pnpm db:push

echo "→ Populando banco com dados de exemplo..."
pnpm db:seed

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Para iniciar o desenvolvimento:"
echo "  pnpm dev"
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001/api/v1"
echo "  DB Studio: pnpm db:studio"
echo ""
echo "Credenciais de teste (senha: Admin@1234):"
echo "  Admin:       admin@escolademo.com"
echo "  Coordenador: coord@escolademo.com"
echo "  Professor:   professor@escolademo.com"
echo "  Aluno:       aluno@escolademo.com"
