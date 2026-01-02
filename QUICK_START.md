# 🚀 QUICK START - Fase 1 Firebase Auth

## ⚡ Tl;dr em 5 Minutos

**Fase 1 foi completada. Você tem tudo pronto para testar Firebase Auth localmente.**

### Arquivos Criados
- `server/firebaseAdmin.ts` — Firebase Admin SDK
- `server/firebaseAuth.ts` — Middleware de verificação
- `client/src/lib/firebase.ts` — Firebase client SDK
- Documentação completa (4 arquivos)

### Configuração Rápida

```bash
# 1. Obter Service Account Key
# Firebase Console → ⚙️ → Contas de Serviço → Gerar chave privada

# 2. Setvar de ambiente
export SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# 3. Criar .env.local
cat > .env.local << 'EOF'
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
EOF

# 4. Habilitar Firebase Auth
# Firebase Console → Authentication → Método de login → Email/Password

# 5. Criar usuário de teste
# Firebase Console → Authentication → Users → Add user
# Email: test@example.com / Password: Test123456

# 6. Testar
npm run dev
# Abrir http://localhost:5000 → Login com test@example.com / Test123456
```

### Esperado
- ✅ Login funciona
- ✅ Usuário criado em PostgreSQL
- ✅ Redireciona para dashboard
- ✅ Endpoints funcionam

---

## 📚 Documentos para Ler

| Documento | Por Quê | Tempo |
|-----------|---------|-------|
| **README_FASE_1.md** | Overview completo | 10 min |
| **PHASE_1_FIREBASE_AUTH_SETUP.md** | Setup detalhado + troubleshooting | 20 min |
| **PHASE_1_COMPLETE.md** | Detalhes técnicos | 15 min |

---

## 📦 O que Mudou

| Antes | Depois |
|-------|--------|
| Session cookies | ID tokens |
| CPF + senha | Email + senha |
| Senhas em DB | Firebase Auth |
| Sem expiração | 1 hora (auto-refresh) |

**PostgreSQL continua igual.** Nenhuma migration necessária.

---

## ✅ Checklist Rápido

- [ ] SERVICE_ACCOUNT_KEY obtida e setada
- [ ] .env.local criado com credenciais Firebase
- [ ] Firebase Auth habilitado (Email/Password)
- [ ] Usuário de teste criado
- [ ] `npm run dev` funciona
- [ ] Login em http://localhost:5000 funciona
- [ ] Usuário criado em PostgreSQL
- [ ] Dashboard carrega após login

---

## 🎯 Próximo Passo

Quando tudo funcionar:
1. Confirme que PostgreSQL tem o novo usuário
2. Teste endpoints de negócio (`/api/employees`)
3. Comece Fase 2 (Firestore) quando pronto

---

## 🆘 Erro?

Leia **PHASE_1_FIREBASE_AUTH_SETUP.md** seção "Troubleshooting"

---

**Fase 1: ✅ COMPLETA**
