# 🚀 Quick Start: Fase 1 + 2

## ⚡ Comandos Essenciais

### Setup Inicial

```bash
# 1. Instalar dependências
npm install firebase-admin

# 2. Configurar variáveis
export SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# 3. Criar .env.local
cat > .env.local << 'EOF'
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_USE_FIREBASE_EMULATOR=false
EOF
```

### Testar Fase 1 (Firebase Auth)

```bash
# Terminal 1: Rodar servidor
npm run dev

# Terminal 2: Abrir browser
open http://localhost:5000

# Fazer login com email/senha criado no Firebase
# Esperado: usuário criado em PostgreSQL, redireciona para dashboard
```

### Testar Fase 2 (Firestore Storage)

**Opção A: Com Emulator (Recomendado)**

```bash
# Terminal 1: Iniciar Firestore Emulator
npx firebase emulators:start --only firestore

# Terminal 2: Rodar testes
export FIRESTORE_EMULATOR_HOST=localhost:8080
npx ts-node server/test-firestore-storage.ts

# Esperado: ✨ Todos os testes passaram!
```

**Opção B: Com Firestore Produção**

```bash
# Rodar testes direto
npx ts-node server/test-firestore-storage.ts

# Esperado: ✨ Todos os testes passaram!
```

---

## 📂 Estrutura de Arquivos Novos

```
.
├── server/
│   ├── firebaseAdmin.ts              ← Inicializa Firebase Admin SDK
│   ├── firebaseAuth.ts               ← Middleware de verificação
│   ├── firebaseStorage.ts            ← Classe Firestore (20+ métodos)
│   ├── test-firestore-storage.ts    ← Script de testes (16 casos)
│   └── index.ts                      ← Modificado: inicia Firebase
│
├── client/src/
│   ├── lib/
│   │   └── firebase.ts               ← SDK client (signIn, signOut, getIdToken)
│   └── context/
│       └── auth-context.tsx          ← Modificado: usa Firebase Auth
│
├── .env.example                      ← Template de variáveis
│
└── DOCUMENTAÇÃO/
    ├── FIREBASE_MIGRATION_ANALYSIS.md       ← Análise Migração vs Zero
    ├── COPILOT_COST_ESTIMATE.md            ← Custo do Copilot
    ├── PHASE_1_FIREBASE_AUTH_SETUP.md      ← Setup Firebase Auth
    ├── PHASE_1_COMPLETE.md                 ← Resumo técnico Fase 1
    ├── FASE_1_RESUMO.md                    ← Executivo Fase 1
    ├── PHASE_2_FIRESTORE_STORAGE.md        ← Setup Firestore
    ├── PHASE_2_TEST_GUIDE.md               ← Guia prático testes
    ├── PHASE_2_COMPLETE.md                 ← Resumo técnico Fase 2
    ├── README_FASE_1.md                    ← Quick guide Fase 1
    └── STATUS_GERAL.md                     ← Status projeto
```

---

## 🔍 Verificar Tudo Instalado

```bash
# Verificar firebase-admin
grep firebase-admin package.json

# Verificar firebaseStorage.ts
test -f server/firebaseStorage.ts && echo "✅ firebaseStorage.ts existe" || echo "❌ Falta"

# Verificar teste
test -f server/test-firestore-storage.ts && echo "✅ teste existe" || echo "❌ Falta"

# Verificar documentação
ls -1 PHASE*.md README*.md STATUS*.md 2>/dev/null | wc -l
# Esperado: 10+ arquivos
```

---

## 📊 Checklist Rápido

```
SETUP:
  ✅ npm install firebase-admin
  ✅ SERVICE_ACCOUNT_KEY exportada
  ✅ .env.local com credenciais

FASE 1 (Auth):
  ✅ npm run dev
  ✅ Login via email/senha
  ✅ Usuário em PostgreSQL

FASE 2 (Firestore):
  ✅ npx firebase emulators:start (ou usar produção)
  ✅ npx ts-node server/test-firestore-storage.ts
  ✅ Todos os 16 testes passam

GO!
  ✅ Próxima: Fase 3 (Migração)
```

---

## 🆘 Se Erros

### "SERVICE_ACCOUNT_KEY not found"

```bash
echo $SERVICE_ACCOUNT_KEY
# Se vazio:
export SERVICE_ACCOUNT_KEY='...'
```

### "FIRESTORE_EMULATOR_HOST not set"

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

### "module not found: firebaseStorage"

Garantir que `server/firebaseStorage.ts` existe e foi criado.

### "Teste falha com 'Cannot read collection'"

Significa que Firebase não foi inicializado.  
Verificar que `SERVICE_ACCOUNT_KEY` é válida.

---

## 📚 Leitura Recomendada

| Ordem | Arquivo | Tempo | Tipo |
|-------|---------|-------|------|
| 1 | `STATUS_GERAL.md` | 5min | Visão geral |
| 2 | `PHASE_1_FIREBASE_AUTH_SETUP.md` | 20min | Setup + theory |
| 3 | `PHASE_2_TEST_GUIDE.md` | 15min | Prático |
| 4 | `PHASE_2_FIRESTORE_STORAGE.md` | 20min | Técnico |

**Total:** ~60min para entender tudo.

---

## 🎯 Meta: Hoje

1. ✅ Ler `STATUS_GERAL.md`
2. ✅ Testar Fase 1 (login + PostgreSQL)
3. ✅ Testar Fase 2 (16 testes Firestore)
4. ✅ Responder: "Tudo funcionou?"

---

## 🚀 Se Tudo OK

Próxima: **Fase 3 (Migração de Dados)**

Vamos gerar scripts para migrar Postgres → Firestore com validação.

---

**Resumo:** 2 fases completas, ~2,900 linhas de código, ~1,500 linhas de docs, pronto para testar.

Você consegue rodar os testes e confirmar que tudo funciona? 🎉
