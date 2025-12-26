# Guia de Manutenção - Sistema de Ponto Eletrônico em GCP

## 📅 Rotina Mensal (30 minutos)

### Semana 1: Verificação de Status
```bash
# Conectar via SSH na VM
# Verificar se aplicação está rodando
sudo systemctl status ponto-app

# Ver últimos 20 logs
sudo journalctl -u ponto-app -n 20

# Verificar espaço em disco
df -h
```

### Semana 2: Backup Manual
```bash
# Executar no console GCP Cloud Shell
gcloud sql backups create \
  --instance=ponto-db \
  --description="Backup mensal $(date +%Y-%m-%d)"
```

### Semana 3: Checar Métricas
1. Abrir GCP Console
2. Ir para **Cloud SQL** → **ponto-db**
3. Abrir aba **Métricas**
4. Verificar:
   - CPU: Deve estar abaixo de 20%
   - Conexões: Deve estar abaixo de 10
   - Armazenamento: Deve estar abaixo de 3GB

### Semana 4: Verificar Alertas
1. Abrir GCP Console
2. Ir para **Monitoramento** → **Políticas de alertas**
3. Verificar se houve disparos

---

## 🚨 Solução Rápida de Problemas

### Aplicação não responde
```bash
# Verificar se está rodando
sudo systemctl status ponto-app

# Reiniciar
sudo systemctl restart ponto-app

# Aguardar 10 segundos e testar
sleep 10
curl http://localhost:5000

# Se ainda não funcionar, ver log completo
sudo journalctl -u ponto-app -n 100
```

### Erro de conexão com banco de dados
```bash
# Testar conectividade
psql -h CLOUD_SQL_IP -U ponto_user -d ponto_db -c "SELECT 1"

# Se pedir senha, a senha está incorreta
# Redefinir senha no Cloud SQL Console
```

### Espaço em disco cheio
```bash
# Ver uso
df -h

# Limpar logs antigos
sudo journalctl --vacuum=30d

# Limpar npm cache
npm cache clean --force
```

### Alterar porta (se necessário)
```bash
# Editar .env.production
nano .env.production

# Mudar: PORT=5000 para outra porta
# Salvar com Ctrl+O, Enter, Ctrl+X

# Reiniciar
sudo systemctl restart ponto-app
```

---

## 📊 Monitoramento Simplificado

### Script de Health Check (Executar 1x por semana)
```bash
#!/bin/bash
# health-check.sh

echo "=== Verificação de Saúde do Sistema ==="
echo ""

# 1. Checar se aplicação está rodando
if sudo systemctl is-active --quiet ponto-app; then
    echo "✅ Aplicação: ATIVA"
else
    echo "❌ Aplicação: INATIVA"
    sudo systemctl restart ponto-app
    sleep 5
fi

# 2. Testar acesso HTTP
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200\|301\|302"; then
    echo "✅ HTTP: RESPONDENDO"
else
    echo "❌ HTTP: NÃO RESPONDENDO"
fi

# 3. Testar banco de dados
if sudo systemctl is-active --quiet ponto-app; then
    echo "✅ Banco de Dados: CONECTADO"
else
    echo "❌ Banco de Dados: ERRO"
fi

# 4. Espaço em disco
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "✅ Espaço em Disco: OK (${DISK_USAGE}%)"
else
    echo "⚠️  Espaço em Disco: CRÍTICO (${DISK_USAGE}%)"
fi

echo ""
echo "Verificação concluída!"
```

Salvar como `~/health-check.sh` e executar:
```bash
chmod +x ~/health-check.sh
bash ~/health-check.sh
```

---

## 🔄 Atualizar Aplicação

### Quando Você Fizer Alterações no Código
```bash
cd ~/ponto-app

# 1. Pegar últimas mudanças
git pull origin main

# 2. Instalar novas dependências (se houver)
npm install

# 3. Compilar
npm run build

# 4. Reiniciar aplicação
sudo systemctl restart ponto-app

# 5. Verificar se iniciou corretamente
sleep 5
sudo systemctl status ponto-app
```

---

## 💾 Restaurar Banco de Dados (Em Caso de Problema)

### 1. Ver Backups Disponíveis
```bash
gcloud sql backups list --instance=ponto-db
```

### 2. Restaurar de Backup
1. Abrir GCP Console
2. Ir para **Cloud SQL** → **ponto-db** → **Backups**
3. Clicar em **Restaurar** no backup desejado
4. Confirmar restauração
5. Aguardar 5-10 minutos

⚠️ **Aviso**: Isto sobrescreverá dados atuais. Use com cuidado!

---

## 📝 Logs para Debugging

### Ver Logs da Aplicação
```bash
# Últimas 50 linhas
sudo journalctl -u ponto-app -n 50

# Últimas 2 horas
sudo journalctl -u ponto-app --since "2 hours ago"

# Acompanhando em tempo real
sudo journalctl -u ponto-app -f
```

### Ver Logs do Cloud SQL
1. GCP Console → **Cloud SQL** → **ponto-db** → **Logs**
2. Filtrar por data/hora do problema
3. Procurar por mensagens de erro

---

## 🔐 Segurança Mensal

- [ ] Verificar se há atualizações de sistema (sudo apt list --upgradable)
- [ ] Verificar se há atualizações de Node.js
- [ ] Revisar últimos acessos SSH
- [ ] Confirmar que .env.production não está versionado no Git

---

## 📞 Quando Chamar Suporte Google

Abra ticket se encontrar:
- Erros recorrentes no Cloud SQL
- Problema com conectividade de rede
- Necessidade de aumentar recursos beyond Free Tier
- Erro ao restaurar backup

Acesse: [support.google.com](https://support.google.com)

---

## ✅ Checklist Pós-Deploy

- [ ] Aplicação acessível em http://IP:5000
- [ ] Login funciona (admin: CPF 00000000000)
- [ ] Registros de ponto funcionam
- [ ] Relatórios PDF geram corretamente
- [ ] Backups estão sendo executados
- [ ] Não há erros de conexão nos logs
- [ ] Espaço em disco OK (>80% livre)
- [ ] CPU OK (<20% uso)

---

## 📈 Expansão Futura

Se precisar:

### Aumentar Recursos (Cobrado)
```bash
# Mudar tipo de máquina
gcloud compute instances stop ponto-eletronico-vm
gcloud compute instances set-machine-type ponto-eletronico-vm \
  --machine-type e2-small
gcloud compute instances start ponto-eletronico-vm
```

### Adicionar Mais Armazenamento
```bash
# No GCP Console: Compute Engine → Discos → Criar
```

### Migrar para Banco de Dados Maior
```bash
# Criar nova instância Cloud SQL maior
# Restaurar backup nela
# Atualizar CONNECTION STRING
```

---

## Dúvidas Frequentes

**P: Preciso fazer algo todos os dias?**
R: Não. A aplicação funciona automaticamente. Apenas verifique 1x por semana.

**P: E se a aplicação cair?**
R: Ela reinicia automaticamente (systemd reinicia). Você verá erro no acesso.

**P: Qual o melhor horário para fazer backup manual?**
R: Entre 2AM-4AM (horário que menos gente usa).

**P: Posso acessar o banco via pgAdmin?**
R: Sim. Use IP privado da Cloud SQL + credenciais. Requer SSH tunnel.

**P: Quanto vai custar se crescer?**
R: Sempre Free Tier até 10GB. Depois, ~$1/mês por GB.

