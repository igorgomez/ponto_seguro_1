#!/bin/bash

# Script de Migração Automática para GCP
# Sistema de Ponto Eletrônico
# Uso: bash gcp-migration-setup.sh

set -e  # Parar em caso de erro

echo "=================================="
echo "Setup Automático - GCP Migration"
echo "Sistema de Ponto Eletrônico"
echo "=================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir com cor
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# ============================================
# 1. VERIFICAR SISTEMA OPERACIONAL
# ============================================
log_info "Verificando sistema operacional..."

if ! grep -q "debian\|ubuntu" /etc/os-release; then
    log_error "Este script requer Debian ou Ubuntu"
    exit 1
fi

log_info "Sistema detectado: $(lsb_release -d | cut -f2)"

# ============================================
# 2. ATUALIZAR SISTEMA
# ============================================
log_info "Atualizando pacotes do sistema..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# ============================================
# 3. INSTALAR NODE.JS
# ============================================
log_info "Instalando Node.js v18..."

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - -qq
    sudo apt-get install -y nodejs -qq
    log_info "Node.js instalado: $(node --version)"
else
    log_warn "Node.js já instalado: $(node --version)"
fi

# ============================================
# 4. INSTALAR POSTGRESQL CLIENT
# ============================================
log_info "Instalando PostgreSQL client..."

if ! command -v psql &> /dev/null; then
    sudo apt-get install -y postgresql-client -qq
    log_info "PostgreSQL client instalado"
else
    log_warn "PostgreSQL client já instalado"
fi

# ============================================
# 5. INSTALAR GIT
# ============================================
log_info "Verificando Git..."

if ! command -v git &> /dev/null; then
    sudo apt-get install -y git -qq
    log_info "Git instalado"
else
    log_warn "Git já instalado"
fi

# ============================================
# 6. INSTALAR DEPENDÊNCIAS DO PROJETO
# ============================================
log_info "Instalando dependências do projeto..."

if [ ! -d "node_modules" ]; then
    npm install --silent
    log_info "Dependências instaladas"
else
    log_warn "node_modules já existe"
fi

# ============================================
# 7. BUILD DO PROJETO
# ============================================
log_info "Compilando projeto..."

npm run build

if [ ! -d "dist" ]; then
    log_error "Build falhou - pasta dist não criada"
    exit 1
fi

log_info "Build completado com sucesso"

# ============================================
# 8. SOLICITAR VARIÁVEIS DE AMBIENTE
# ============================================
echo ""
echo "=================================="
echo "Configuração de Variáveis"
echo "=================================="
echo ""

log_warn "Você precisa adicionar as seguintes variáveis ao arquivo .env.production:"
echo ""

# Criar arquivo .env.production template se não existir
if [ ! -f ".env.production" ]; then
    cat > .env.production.template << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://ponto_user:SENHA@IP_PRIVADO:5432/ponto_db
VITE_FIREBASE_API_KEY=sua_chave_aqui
VITE_FIREBASE_APP_ID=seu_app_id_aqui
VITE_FIREBASE_PROJECT_ID=seu_project_id_aqui
EOF
    
    log_info "Arquivo .env.production.template criado"
    echo "Edite o arquivo: nano .env.production.template"
    echo "Depois copie para: cp .env.production.template .env.production"
    
    read -p "Pressione Enter quando terminar de configurar..."
fi

if [ ! -f ".env.production" ]; then
    log_error ".env.production não encontrado"
    exit 1
fi

log_info ".env.production configurado"

# ============================================
# 9. CRIAR SYSTEMD SERVICE
# ============================================
log_info "Criando serviço systemd..."

sudo tee /etc/systemd/system/ponto-app.service > /dev/null << EOF
[Unit]
Description=Sistema de Ponto Eletrônico
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD
Environment="NODE_ENV=production"
Environment="PORT=5000"
EnvironmentFile=$PWD/.env.production
ExecStart=$(which node) dist/server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ponto-app

log_info "Serviço systemd criado"

# ============================================
# 10. TESTAR BANCO DE DADOS
# ============================================
echo ""
log_info "Testando conectividade de banco de dados..."
log_warn "Isto pode falhar se o banco ainda não foi criado no Cloud SQL"

if [ -f ".env.production" ]; then
    DB_URL=$(grep DATABASE_URL .env.production | cut -d= -f2)
    
    if timeout 5 psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
        log_info "Conexão com banco de dados OK"
    else
        log_warn "Não foi possível conectar ao banco de dados"
        log_warn "Verifique se Cloud SQL está provisionado e acessível"
    fi
fi

# ============================================
# 11. RESUMO
# ============================================
echo ""
echo "=================================="
echo "Setup Completado!"
echo "=================================="
echo ""
echo -e "${GREEN}Próximos passos:${NC}"
echo ""
echo "1. Inicie o serviço:"
echo "   sudo systemctl start ponto-app"
echo ""
echo "2. Verifique o status:"
echo "   sudo systemctl status ponto-app"
echo ""
echo "3. Veja os logs:"
echo "   sudo journalctl -u ponto-app -f"
echo ""
echo "4. Acesse a aplicação:"
echo "   http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "5. Para parar o serviço:"
echo "   sudo systemctl stop ponto-app"
echo ""
echo "=================================="
echo "Documentação: Veja GCP_MIGRATION_GUIDE.md"
echo "=================================="
