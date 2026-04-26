#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# GOSF — Setup inicial do VPS (executar UMA ÚNICA VEZ como root)
# Testado em: Ubuntu 22.04 LTS / 24.04 LTS
#
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/niktronixbr/GOSF/main/scripts/setup-vps.sh | bash
#   ou copie e execute manualmente.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_USER="deploy"
APP_DIR="/opt/gosf"
GHCR_OWNER="niktronixbr"

echo "=== GOSF VPS Setup ==="

# ── 1. Dependências do sistema ───────────────────────────────────────────────
echo "→ Atualizando pacotes..."
apt-get update -qq
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg lsb-release ufw

# ── 2. Docker (caso não instalado) ──────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "→ Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version &>/dev/null 2>&1; then
  echo "→ Instalando Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
fi

# ── 3. Usuário de deploy sem senha ──────────────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "→ Criando usuário $DEPLOY_USER..."
  useradd -m -s /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

# ── 4. Diretório da aplicação ────────────────────────────────────────────────
echo "→ Criando $APP_DIR..."
mkdir -p "$APP_DIR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

# ── 5. Chave SSH para o usuário deploy ───────────────────────────────────────
DEPLOY_SSH_DIR="/home/$DEPLOY_USER/.ssh"
mkdir -p "$DEPLOY_SSH_DIR"
chmod 700 "$DEPLOY_SSH_DIR"

if [ ! -f "$DEPLOY_SSH_DIR/authorized_keys" ]; then
  touch "$DEPLOY_SSH_DIR/authorized_keys"
fi
chmod 600 "$DEPLOY_SSH_DIR/authorized_keys"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_SSH_DIR"

echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ PRÓXIMO PASSO: adicione a chave pública do GitHub Actions        │"
echo "│                                                                   │"
echo "│ Na sua máquina local, gere o par de chaves:                      │"
echo "│   ssh-keygen -t ed25519 -C 'gosf-deploy' -f ~/.ssh/gosf-deploy   │"
echo "│                                                                   │"
echo "│ Copie a chave PÚBLICA para o VPS:                                │"
echo "│   ssh-copy-id -i ~/.ssh/gosf-deploy.pub deploy@<IP_DO_VPS>       │"
echo "│                                                                   │"
echo "│ Copie a chave PRIVADA como GitHub Secret SSH_KEY:                │"
echo "│   cat ~/.ssh/gosf-deploy                                          │"
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""

# ── 6. Firewall básico ───────────────────────────────────────────────────────
echo "→ Configurando UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp     # Nginx / proxy reverso
ufw allow 443/tcp    # HTTPS
ufw --force enable

# ── 7. Nginx (proxy reverso) ─────────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  echo "→ Instalando Nginx..."
  apt-get install -y nginx
  systemctl enable nginx
fi

# Cria config de proxy reverso básica (ajuste os domínios)
NGINX_CONF="/etc/nginx/sites-available/gosf"
if [ ! -f "$NGINX_CONF" ]; then
  cat > "$NGINX_CONF" <<'NGINX'
# Substitua seudominio.com pelo seu domínio real

server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/gosf
  nginx -t && systemctl reload nginx
fi

# ── 8. .env.production no VPS ────────────────────────────────────────────────
ENV_FILE="$APP_DIR/.env.production"
if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo "⚠  Crie o arquivo $ENV_FILE com as variáveis de produção."
  echo "   Use .env.production.example do repositório como base."
  echo ""
fi

# ── 9. docker-compose.prod.yml no VPS ────────────────────────────────────────
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "⚠  Copie o docker-compose.prod.yml do repositório para $COMPOSE_FILE"
fi

echo ""
echo "✅ Setup do VPS concluído!"
echo ""
echo "Resumo dos próximos passos:"
echo "  1. Configure a chave SSH (veja instruções acima)"
echo "  2. Copie .env.production.example → $ENV_FILE e preencha os valores"
echo "  3. Copie docker-compose.prod.yml → $COMPOSE_FILE"
echo "  4. Configure os GitHub Secrets (Settings → Secrets → Actions):"
echo "     SSH_HOST         = $(curl -s ifconfig.me)"
echo "     SSH_USER         = $DEPLOY_USER"
echo "     SSH_KEY          = (chave privada ed25519)"
echo "     SSH_PORT         = 22"
echo "     NEXT_PUBLIC_API_URL = https://api.seudominio.com/api/v1"
echo "     DEPLOY_GHCR_TOKEN   = (GitHub PAT com read:packages)"
echo "  5. Configure HTTPS com Certbot:"
echo "     apt install certbot python3-certbot-nginx"
echo "     certbot --nginx -d seudominio.com -d api.seudominio.com"
echo ""
echo "  Após configurar os secrets, qualquer push em main dispara o deploy!"
