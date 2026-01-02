# Fase 1: Setup Firebase Auth - Instruções

## 1. Configurar Credenciais Firebase (Server)

### Obter Service Account Key

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá para: **⚙️ Configurações do Projeto** → **Contas de serviço**
4. Clique em "Gerar nova chave privada"
5. Salve o arquivo JSON

### Configurar Variável de Ambiente

```bash
# Copie o conteúdo do JSON da service account
cat seu-service-account-key.json

# Adicione ao .env (escapeando aspas):
export SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"seu-projeto",...}'

# OU use arquivo (não recomendado em produção):
export SERVICE_ACCOUNT_KEY=$(cat /path/to/service-account-key.json)
```

**Segurança:** 
- Nunca commite `service-account-key.json` no Git
- Armazene em secret manager (GCP Secret Manager, GitHub Secrets, etc)
- Rotacione keys periodicamente

---

## 2. Configurar Firebase Client (Frontend)

### Obter Credenciais Public

1. Firebase Console → **Configurações do Projeto**
2. Copie valores de "Sua aplicação web":

```javascript
{
  "apiKey": "AIza...",
  "authDomain": "seu-projeto.firebaseapp.com",
  "projectId": "seu-projeto",
  "storageBucket": "seu-projeto.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abc123..."
}
```

### Adicionar ao `.env.local`

```env
# Firebase Client Config (public - safe to expose)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...

# Opcional: use Firebase Emulator em dev
VITE_USE_FIREBASE_EMULATOR=false
```

---

## 3. Habilitar Auth Methods no Firebase

1. Firebase Console → **Authentication**
2. Vá para "Método de login"
3. Habilite **Email/Password**
4. Considere habilitar **Google Sign-In** (opcional)

---

## 4. Atualizar Database Schema (Drizzle Migration)

Adicionar coluna `firebase_uid` à tabela `users`:

```bash
# Criar migration
drizzle-kit generate postgres --name add_firebase_uid

# Verificar arquivo gerado em migrations/
# Deve conter:
# ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE;

# Aplicar
npm run db:push
```

**Ou executar SQL direto** (se não usar migrations):

```sql
ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE;
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
```

---

## 5. Novos Endpoints do Servidor

### POST /api/auth/firebase-login

Sincroniza login do Firebase com usuário local.

**Request:**
```json
{
  "email": "user@example.com",
  "uid": "firebase-uid-aqui"
}
```

**Headers:**
```
Authorization: Bearer <idToken>
Content-Type: application/json
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "user@example.com",
    "tipo": "empregado",
    "ativo": true,
    "primeiro_acesso": true
  }
}
```

---

## 6. Fluxo de Autenticação (Novo)

### Cliente (Frontend)

```
1. Usuário preenche email + senha
2. Clica "Login"
3. signIn(email, password) → Firebase Auth
4. Firebase retorna FirebaseUser + idToken
5. getIdToken(user) → obtém ID token
6. POST /api/auth/firebase-login com idToken
7. Servidor valida idToken, sincroniza usuário local
8. Retorna dados do usuário
9. Frontend armazena firebaseUser em contexto
10. Redireciona para dashboard
```

### Servidor (Backend)

```
1. Recebe POST /api/auth/firebase-login com idToken
2. Middleware firebaseAuthMiddleware verifica token
3. Extrai firebase_uid do token
4. Procura usuário local por firebase_uid
5. Se não existe, cria usuário local
6. Retorna dados do usuário sem senha
```

---

## 7. Como Usar no Código

### No Contexto de Auth

```tsx
const { user, firebaseUser, login, logout } = useAuth();

// Login
const result = await login('user@example.com', 'password123');
if (result.success) {
  // Ir para dashboard
}

// Logout
await logout();
```

### Enviar Token em Requests

```tsx
// O novo contexto já faz isso automaticamente
// Mas se precisar manualmente:

const { firebaseUser } = useAuth();
const idToken = await firebaseUser.getIdToken();

const response = await fetch('/api/time-records/register', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ type: 'entry' }),
});
```

---

## 8. Compatibilidade com Código Existente

### O que muda

- ✅ Auth context agora usa Firebase
- ✅ Sessão Express é opcional (pode manter para compatibilidade)
- ✅ Novos endpoints `/api/auth/firebase-login`
- ✅ Middleware novo `firebaseAuthMiddleware`
- ✅ CPF já não é mais usado para login (usar email)

### O que não muda

- ✅ Banco de dados continua sendo PostgreSQL
- ✅ Tabelas de `time_records` e `work_schedules` continuam iguais
- ✅ Endpoints de `/api/employees`, `/api/time-records` funcionam normalmente
- ✅ Interface `IStorage` continua compatível
- ✅ Middleware `authMiddleware` pode coexistir com Firebase (para rollback)

---

## 9. Testes

### Testar Sign-In

```bash
# 1. Criar usuário no Firebase Console (Auth → Usuários → Adicionar usuário)
# Email: test@example.com
# Senha: Test123456

# 2. No frontend, login com essas credenciais
# 3. Verificar se:
#    - Toast de sucesso aparece
#    - Usuário é criado/atualizado no banco local
#    - Redirect para dashboard funciona
```

### Testar Token Verification

```bash
# 1. Abrir DevTools → Console
# 2. Executar:
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
console.log(token); // Copiar token

# 3. Testar endpoint:
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"

# 4. Deve retornar dados do usuário (sem senha)
```

---

## 10. Próximos Passos

- [ ] Fase 2: Reescrever `server/storage.ts` com Firestore
- [ ] Fase 3: Migrar dados de PostgreSQL → Firestore
- [ ] Fase 4: Remover dependência de PostgreSQL (quando tudo funcionar)
- [ ] Fase 5: Implementar Firestore Security Rules

---

## Troubleshooting

### "SERVICE_ACCOUNT_KEY not found in environment"

```bash
# Verificar se variável está setada
echo $SERVICE_ACCOUNT_KEY

# Se vazio, fazer:
export SERVICE_ACCOUNT_KEY='...'

# Em .env file, não esquecer de usar JSON válido
```

### "Token inválido / expirado"

- Tokens expõem após 1 hora
- Usar `getIdToken(true)` para fazer refresh
- Middleware detecta automaticamente

### "Usuário não encontrado no servidor"

- Pode ser primeira vez que faz login
- Middleware cria usuário automaticamente
- Se erro, verificar logs do servidor

---

## Recursos

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite) (para dev local)
