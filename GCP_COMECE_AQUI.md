# 🚀 COMECE AQUI - Migração para Google Cloud

## ⏱️ Tempo Total: ~3-4 horas

## 📋 O que você precisa fazer (resumo)

### PARTE 1: Preparação (30 minutos)
- [ ] Crie conta Google Cloud
- [ ] Configure VM Linux (Debian 12)
- [ ] Configure Cloud SQL PostgreSQL

### PARTE 2: Deploy (1-2 horas)
- [ ] Clone seu repositório na VM
- [ ] Execute script automático de setup
- [ ] Inicie a aplicação

### PARTE 3: Configuração (30 minutos)
- [ ] Configure variáveis de ambiente
- [ ] Configure backups automáticos
- [ ] Teste acesso à aplicação

---

## 🎯 Passo a Passo Rápido

### 1️⃣ Criar Conta GCP (5 minutos)

```
Acesse: google.com/cloud/free
→ Clique "Começar gratuitamente"
→ Faça login com Gmail
→ Adicione cartão de crédito (não será cobrado)
→ Crie projeto: "ponto-eletronico"
```

**Importante**: GCP cobra $1 para verificar cartão. Este $1 é reembolsado em 3-5 dias.

---

### 2️⃣ Criar VM (10 minutos)

No Console GCP:
1. Menu esquerdo → **Compute Engine** → **Instâncias de VM**
2. Clique **Criar instância**
3. Preencha:

```
Nome: ponto-eletronico-vm
Região: us-central1
Zona: us-central1-a
Tipo de máquina: e2-micro ✓ (Always Free)
Imagem: Debian 12
Disco: 30GB ✓ (Always Free)
Tráfego HTTP: ✓ Marcar
Tráfego HTTPS: ✓ Marcar
```

4. Clique **Criar**
5. Aguarde 2-3 minutos

---

### 3️⃣ Configurar Firewall (5 minutos)

1. Menu esquerdo → **VPC Network** → **Firewall**
2. Clique **Criar regra de firewall**
3. Preencha:

```
Nome: allow-app
Direção: Entrada
Protocolos: TCP 80, 443, 5000
Intervalo IP: 0.0.0.0/0
```

4. Clique **Criar**

---

### 4️⃣ Criar Cloud SQL (10 minutos)

1. Menu esquerdo → **Cloud SQL** → **Instâncias**
2. Clique **Criar instância** → Escolha **PostgreSQL**
3. Preencha:

```
ID: ponto-db
Versão: PostgreSQL 15
Região: us-central1
Zona: us-central1-a
Tipo de máquina: db-f1-micro ✓ (Always Free)
```

4. Clique **Criar**
5. Aguarde 10 minutos

**Quando terminar:**
- Abra a instância `ponto-db`
- Aba **Bancos de Dados** → Criar banco: `ponto_db`
- Aba **Usuários** → Criar usuário: `ponto_user` com senha forte

---

### 5️⃣ Deploy da Aplicação (1-2 horas)

Na instância VM, clique **SSH** para abrir terminal:

```bash
# 1. Clone o repositório
cd /home/$(whoami)
git clone https://github.com/seu-usuario/seu-repo.git ponto-app
cd ponto-app

# 2. Execute script automático
chmod +x ../gcp-migration-setup.sh
bash ../gcp-migration-setup.sh

# 3. Configure variáveis de ambiente
nano .env.production
```

**Adicione:**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://ponto_user:SENHA@IP_PRIVADO:5432/ponto_db
VITE_FIREBASE_API_KEY=sua_chave
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_PROJECT_ID=seu_project_id
```

**Onde obter IP privado do Cloud SQL:**
- GCP Console → Cloud SQL → ponto-db → Visão Geral → "Endereço IP privado"

**Salve:** `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
# 4. Reinicie a aplicação
sudo systemctl restart ponto-app

# 5. Verifique se iniciou
sleep 5
sudo systemctl status ponto-app
```

---

### 6️⃣ Testar Acesso (5 minutos)

1. Volte para GCP Console → Compute Engine → ponto-eletronico-vm
2. Copie **Endereço IP externo**
3. Abra navegador: `http://IP_EXTERNO:5000`

**Se funcionar:**
- ✅ Faça login com CPF: 00000000000, Senha: senha123
- ✅ Registre um ponto
- ✅ Gere um relatório PDF

---

### 7️⃣ Configurar Backups (5 minutos)

1. GCP Console → Cloud SQL → ponto-db → Editar
2. Procure **Automação**
3. Ative **Backups automáticos**
4. Hora: 02:00 (UTC)
5. Clique **Salvar**

---

## 📊 Verificar Status

```bash
# SSH na VM
sudo systemctl status ponto-app
sudo journalctl -u ponto-app -n 20
curl http://localhost:5000
```

---

## 💾 Dados do Seu Projeto

Antes de começar, colete:

```
GitHub:
- URL do repositório: https://github.com/seu-usuario/seu-repo
- Branch: main

Firebase:
- VITE_FIREBASE_API_KEY: [obter do console Firebase]
- VITE_FIREBASE_APP_ID: [obter do console Firebase]
- VITE_FIREBASE_PROJECT_ID: [obter do console Firebase]

GCP (preenchidos durante setup):
- Projeto GCP: ponto-eletronico
- VM: ponto-eletronico-vm
- Cloud SQL: ponto-db
- Usuário DB: ponto_user
- Banco DB: ponto_db
```

---

## ✅ Checklist Final

- [ ] Conta GCP criada
- [ ] VM provisionada e SSH funciona
- [ ] Cloud SQL provisionado
- [ ] Código clonado e buildado
- [ ] .env.production configurado
- [ ] Aplicação respondendo em http://IP:5000
- [ ] Login funciona
- [ ] Backups automáticos ativados
- [ ] Documentação guardada

---

## 🆘 Ajuda Rápida

**Erro de conexão com banco?**
```bash
psql -h IP_PRIVADO -U ponto_user -d ponto_db -c "SELECT 1"
```

**Aplicação não inicia?**
```bash
sudo journalctl -u ponto-app -n 100
```

**Esquecer IP da VM?**
```
GCP Console → Compute Engine → ponto-eletronico-vm → Copiar "Endereço IP externo"
```

**Precisa parar a aplicação?**
```bash
sudo systemctl stop ponto-app
```

**Precisa reiniciar?**
```bash
sudo systemctl restart ponto-app
```

---

## 📚 Próximos Documentos

Depois de concluir o deploy, leia:

1. **MANUTENCAO_GCP.md** - Rotina mensal e solução de problemas
2. **GCP_MIGRATION_GUIDE.md** - Detalhes técnicos completos

---

## 🎓 Conceitos Importantes

- **Always Free**: Seus recursos nunca expiram ou mudam de preço
- **Cloud SQL**: Banco de dados gerenciado (backups automáticos)
- **e2-micro VM**: Máquina econômica, suficiente para sua aplicação
- **Systemd**: Gerenciador que reinicia aplicação se cair

---

## 💬 Dúvidas?

### Antes de começar:
- Leia: GCP_MIGRATION_GUIDE.md (seção "Pré-requisitos")
- Valide: Você tem GitHub, Gmail, cartão de crédito?

### Durante o setup:
- Documentação GCP: https://cloud.google.com/docs
- Console GCP tem suporte por chat (canto inferior direito)

### Depois do deploy:
- Veja MANUTENCAO_GCP.md para rotina
- SSH na VM para troubleshooting

---

**Tempo estimado:** 3-4 horas primeira vez  
**Tempo de manutenção mensal:** 30 minutos  
**Custo permanente:** R$ 0,00

✨ Boa sorte!
