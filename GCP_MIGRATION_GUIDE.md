# Guia Completo de Migração: Replit → Google Cloud Always Free

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Passo 1: Criar Conta GCP](#passo-1-criar-conta-gcp)
3. [Passo 2: Configurar VM](#passo-2-configurar-vm)
4. [Passo 3: Preparar Código](#passo-3-preparar-código)
5. [Passo 4: Deploy](#passo-4-deploy)
6. [Passo 5: Configurar Banco de Dados](#passo-5-configurar-banco-de-dados)
7. [Passo 6: Backups Automáticos](#passo-6-backups-automáticos)
8. [Passo 7: Monitoramento](#passo-7-monitoramento)
9. [Solução de Problemas](#solução-de-problemas)

---

## Pré-requisitos

- [ ] Conta Google (Gmail)
- [ ] Cartão de crédito válido (para verificação - não será cobrado)
- [ ] Código do projeto pronto em Git (GitHub recomendado)
- [ ] Terminal/SSH client instalado

---

## Passo 1: Criar Conta GCP

### 1.1 Registrar-se

1. Acesse [google.com/cloud/free](https://google.com/cloud/free)
2. Clique em **"Começar gratuitamente"** (Start free)
3. Faça login com sua conta Google
4. Preencha:
   - Tipo de conta: **Pessoal** (individual)
   - País: Brazil
   - Aceite os termos

### 1.2 Verificar Cartão de Crédito

1. Adicione um método de pagamento válido
2. Google fará uma cobrança de $1 para verificação
3. Este $1 será reembolsado em 3-5 dias
4. **NÃO será cobrado mais nada** (sempre gratuito)

### 1.3 Criar Projeto

1. No Console GCP, clique em **"Criar Projeto"**
2. Nome: `ponto-eletronico`
3. Clique em **"Criar"**
4. Aguarde 30 segundos para criação

---

## Passo 2: Configurar VM

### 2.1 Criar Instância Compute Engine

1. No menu esquerdo, procure **"Compute Engine"** → **"Instâncias de VM"**
2. Clique em **"Criar instância"**

### 2.2 Configurar Instância

Preencha os campos:

```
Nome: ponto-eletronico-vm
Região: us-central1 (mais econômico para Always Free)
Zona: us-central1-a
Tipo de máquina: e2-micro (Sempre indicado como "elegível para Always Free")
Imagem de inicialização: Debian 12
Disco de inicialização: 30GB (dentro do limite de 30GB gratuitos)
Permitir HTTP: ☑️ Marcar
Permitir HTTPS: ☑️ Marcar
```

3. Clique em **"Criar"**
4. Aguarde 2-3 minutos para provisionamento

### 2.3 Permitir Tráfego Externo

1. Vá para **VPC Network** → **Firewall**
2. Clique em **"Criar regra de firewall"**

```
Nome: allow-app
Direção: Entrada
Ações em correspondência: Permitir
Protocolos e portas:
  - TCP: 80, 443, 5000
Intervalos de IP de origem: 0.0.0.0/0
```

3. Clique em **"Criar"**

---

## Passo 3: Preparar Código

### 3.1 Clonar Repositório na VM

1. Clique na instância criada
2. Clique em **"SSH"** (abre terminal no navegador)
3. Execute:

```bash
cd /home/$(whoami)
git clone https://github.com/seu-usuario/seu-repo.git ponto-app
cd ponto-app
```

### 3.2 Instalar Dependências

```bash
# Atualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL client
sudo apt-get install -y postgresql-client

# Instalar Git (geralmente já vem)
sudo apt-get install -y git

# Verificar instalações
node --version
npm --version
psql --version
```

### 3.3 Instalar Dependências do Projeto

```bash
cd ~/ponto-app
npm install
```

---

## Passo 4: Deploy

### 4.1 Construir Aplicação

```bash
npm run build
```

Este comando:
- Compila o TypeScript
- Cria bundle do frontend com Vite
- Prepara aplicação para produção

### 4.2 Configurar Variáveis de Ambiente

Crie arquivo `.env.production`:

```bash
nano .env.production
```

Adicione:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/ponto_db
VITE_FIREBASE_API_KEY=sua_chave_aqui
VITE_FIREBASE_APP_ID=seu_app_id_aqui
VITE_FIREBASE_PROJECT_ID=seu_project_id_aqui
```

Salve: `Ctrl+O` → `Enter` → `Ctrl+X`

### 4.3 Testar Localmente (Opcional)

```bash
npm run start
```

Abra navegador: `http://localhost:5000`

Pressione `Ctrl+C` para parar

### 4.4 Configurar Systemd (Auto-iniciar)

Crie arquivo de serviço:

```bash
sudo nano /etc/systemd/system/ponto-app.service
```

Copie e cole:

```ini
[Unit]
Description=Sistema de Ponto Eletrônico
After=network.target postgresql.service

[Service]
Type=simple
User=debian
WorkingDirectory=/home/debian/ponto-app
Environment="NODE_ENV=production"
Environment="PORT=5000"
EnvironmentFile=/home/debian/ponto-app/.env.production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ative o serviço:

```bash
sudo systemctl enable ponto-app
sudo systemctl start ponto-app
sudo systemctl status ponto-app
```

---

## Passo 5: Configurar Banco de Dados

### 5.1 Criar Instância Cloud SQL

1. No menu, procure **"Cloud SQL"** → **"Instâncias"**
2. Clique em **"Criar instância"**
3. Escolha: **PostgreSQL**

### 5.2 Configurar CloudSQL

```
ID da instância: ponto-db
Versão: PostgreSQL 15
Região: us-central1 (mesma da VM)
Zona: us-central1-a
Tipo de máquina: db-f1-micro (Always Free)
```

3. Clique em **"Criar instância"**
4. Aguarde 5-10 minutos

### 5.3 Criar Banco de Dados

1. Na instância `ponto-db`, abra aba **"Bancos de Dados"**
2. Clique em **"Criar banco de dados"**

```
Nome do banco: ponto_db
Agrupamento padrão: UTF8
```

3. Clique em **"Criar"**

### 5.4 Criar Usuário

1. Abra aba **"Usuários"**
2. Clique em **"Criar usuário"**

```
Nome de usuário: ponto_user
Senha: Gere uma senha forte (salve em local seguro!)
```

3. Clique em **"Criar"**

### 5.5 Conectar VM ao Cloud SQL

1. Na instância `ponto-db`, abra aba **"Visão Geral"**
2. Copie **"Endereço IP privado"**
3. Adicione ao `.env.production`:

```env
DATABASE_URL=postgresql://ponto_user:sua_senha@IP_PRIVADO:5432/ponto_db
```

4. Redeploy da aplicação:

```bash
cd ~/ponto-app
sudo systemctl restart ponto-app
```

---

## Passo 6: Backups Automáticos

### 6.1 Configurar Backups Automáticos no Cloud SQL

1. Na instância `ponto-db`, abra **"Editar"**
2. Procure **"Automação"**
3. Ative **"Backups automáticos"**

```
Hora de início: 02:00 (horário UTC)
Local: multi-region (mais seguro)
Retenção: 30 dias (padrão)
```

4. Clique em **"Salvar"**

### 6.2 Backup Manual (Mensal)

```bash
# SSH na VM
gcloud sql backups create \
  --instance=ponto-db \
  --description="Backup mensal $(date +%Y-%m-%d)"
```

---

## Passo 7: Monitoramento

### 7.1 Verificar Status da Aplicação

```bash
# Conectar via SSH
sudo systemctl status ponto-app

# Ver logs
sudo journalctl -u ponto-app -f
```

### 7.2 Verificar Status do Banco

1. No Console GCP, acesse **"Cloud SQL"** → `ponto-db`
2. Verifique abas:
   - **"Visão Geral"**: Status da instância
   - **"Métricas"**: CPU, memória, IOPS
   - **"Logs"**: Mensagens de erro

### 7.3 Alertas (Recomendado)

1. Vá para **"Monitoramento"** → **"Políticas de alertas"**
2. Clique em **"Criar política"**

```
Condição:
- Métrica: Cloud SQL Database
- Recurso: ponto-db
- Métrica: CPU > 70%
- Duração: 5 minutos

Notificação:
- Enviar para: seu_email@gmail.com
```

---

## Solução de Problemas

### Aplicação não inicia

```bash
# Ver erro completo
sudo journalctl -u ponto-app -n 50

# Checar variáveis de ambiente
cat /home/debian/ponto-app/.env.production

# Testar manualmente
cd ~/ponto-app
npm run start
```

### Erro de conexão com banco de dados

```bash
# Testar conexão
psql -h IP_PRIVADO -U ponto_user -d ponto_db -c "SELECT 1"

# Verificar se VM consegue acessar Cloud SQL
gcloud sql connect ponto-db --user=ponto_user
```

### Aplicação lenta

1. Verifique métricas no Cloud SQL
2. Verifique CPU da VM
3. Verifique logs de erro
4. Reinicie: `sudo systemctl restart ponto-app`

### Esqueci a senha do banco

1. No Cloud SQL, abra aba **"Usuários"**
2. Selecione usuário `ponto_user`
3. Clique em **"Alterar senha"**
4. Gere nova senha
5. Atualize `.env.production`
6. Restart: `sudo systemctl restart ponto-app`

---

## Checklist Final

- [ ] Conta GCP criada
- [ ] VM provisionada
- [ ] PostgreSQL Cloud SQL criado
- [ ] Código clonado e buildado
- [ ] Banco de dados criado
- [ ] Variáveis de ambiente configuradas
- [ ] Aplicação rodando em http://IP_PUBLICA:5000
- [ ] Backups automáticos ativados
- [ ] Domínio configurado (opcional)

---

## Custos Mensais Esperados

```
Compute Engine (e2-micro): $0.00
Cloud SQL (db-f1-micro): $0.00
Armazenamento: $0.00
---
TOTAL: $0.00 mensais
```

---

## Próximos Passos (Opcional)

### Usar Domínio Próprio

1. Compre domínio em registradora (ex: Namecheap, GoDaddy)
2. Crie Load Balancer no GCP
3. Configure DNS
4. Gere certificado SSL grátis (Let's Encrypt)

### Monitoramento Avançado

1. Instale Prometheus na VM
2. Configure Grafana para dashboards
3. Configure alertas customizados

---

## Suporte

Dúvidas durante a migração?
- Documentação GCP: https://cloud.google.com/docs
- Stack Overflow: Tag `google-cloud-platform`
- Console GCP tem chat de suporte (lado inferior direito)

