# Fase 2: Guia Prático - Como Testar Localmente

## 🎯 Objetivo

Testar `FirestoreStorage` para garantir que todos os métodos funcionam corretamente antes de migrar dados reais.

---

## 📋 Pré-requisitos

- [x] Fase 1 (Firebase Auth) funcionando
- [x] `firebase-admin` instalado
- [x] `firebaseStorage.ts` criado
- [ ] Firestore habilitado no Firebase Console
- [ ] Índices criados (opcional mas recomendado)

---

## 🚀 Opção 1: Testar com Firestore Emulator (Recomendado)

### Passo 1: Instalar Firebase Emulator

```bash
npm install -g firebase-tools

# Ou via npx se não quiser instalar globalmente
npx firebase --version
```

### Passo 2: Inicializar Firebase CLI

```bash
# Apenas necessário uma vez
npx firebase login
npx firebase init
```

### Passo 3: Iniciar Emulator

```bash
# Terminal 1: Iniciar emulator
npx firebase emulators:start --only firestore

# Esperado:
# ┌─────────────────────────────────────────────────────────────┐
# │ ✔  Firestore Emulator running on localhost:8080               │
# └─────────────────────────────────────────────────────────────┘
```

### Passo 4: Configurar Variável de Ambiente

```bash
# Terminal 2:
export FIRESTORE_EMULATOR_HOST=localhost:8080

# Verificar
echo $FIRESTORE_EMULATOR_HOST
```

### Passo 5: Rodar Testes

```bash
# Terminal 2 (com FIRESTORE_EMULATOR_HOST setada):
npx ts-node server/test-firestore-storage.ts
```

**Esperado:**
```
🧪 Iniciando testes de FirestoreStorage...

1️⃣  Testando initializeDb()...
✅ DB inicializado

2️⃣  Testando createUser()...
✅ Usuário criado: 1 Teste User

3️⃣  Testando getUser()...
✅ Usuário encontrado: Teste User

...

✨ Todos os testes passaram!
```

---

## 🌐 Opção 2: Testar com Firestore Produção

### Passo 1: Garantir SERVICE_ACCOUNT_KEY

```bash
# Verificar se está setada
echo $SERVICE_ACCOUNT_KEY

# Se vazio, adicionar:
export SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### Passo 2: Rodar Testes Direto

```bash
npx ts-node server/test-firestore-storage.ts
```

### ⚠️ Aviso

- Vai criar dados reais no Firestore
- Pode gerar custos se exceder free tier
- Use labels/coleções de teste para isolar dados

---

## 📊 Verificar Dados no Firestore

### Via Firebase Console

1. Abrir [Firebase Console](https://console.firebase.google.com/)
2. Selecionar projeto
3. Ir para **Firestore Database**
4. Clicar em cada collection (`users`, `workSchedules`, `timeRecords`)
5. Verificar documentos criados

### Via Firestore Emulator UI

```bash
# Quando emulator está rodando:
# Abrir: http://localhost:4000
# Navegar para Firestore (localhost:8080)
```

---

## 🔍 Verificar Queries

### Via Console JavaScript (Frontend)

```javascript
// Abrir DevTools (F12) → Console
const db = firebase.firestore();

// Verificar users
db.collection('users').get().then(snap => {
  console.log('Users count:', snap.size);
  snap.forEach(doc => console.log(doc.data()));
});

// Verificar timeRecords
db.collection('timeRecords').get().then(snap => {
  console.log('TimeRecords count:', snap.size);
});
```

### Via Firebase CLI

```bash
# Listar collections
npx firebase firestore:describe

# Listar documentos
npx firebase firestore:list users
npx firebase firestore:list timeRecords
```

---

## ✅ Checklist de Testes

Marque cada item conforme testa:

**Métodos de User:**
- [ ] `initializeDb()` - cria admin padrão
- [ ] `createUser()` - cria novo usuário
- [ ] `getUser()` - busca por ID
- [ ] `getUserByCPF()` - busca por CPF
- [ ] `getUserByEmail()` - busca por Email
- [ ] `getUserByFirebaseUid()` - busca por Firebase UID
- [ ] `getAdminUser()` - busca admin
- [ ] `updateUser()` - atualiza dados
- [ ] `getAllEmployees()` - lista empregados

**Métodos de Work Schedule:**
- [ ] `createWorkSchedule()` - cria horário
- [ ] `getEmployeeWorkSchedules()` - lista horários
- [ ] `deleteEmployeeWorkSchedules()` - deleta horários

**Métodos de Time Record:**
- [ ] `createTimeRecord()` - cria registro
- [ ] `getTimeRecord()` - busca por ID
- [ ] `getTimeRecordsByDate()` - busca por data
- [ ] `getEmployeeTimeRecords()` - lista registros do empregado
- [ ] `getEmployeeTimeRecordByDate()` - busca por empregado + data
- [ ] `getAllTimeRecords()` - lista todos
- [ ] `getRecentTimeRecords()` - lista recentes
- [ ] `updateTimeRecord()` - atualiza registro

---

## 🐛 Debugging

### Erro: "FIRESTORE_EMULATOR_HOST not set"

```bash
# Solução:
export FIRESTORE_EMULATOR_HOST=localhost:8080

# Ou adicione ao .env ou arquivo de startup
```

### Erro: "SERVICE_ACCOUNT_KEY not found"

```bash
# Solução:
export SERVICE_ACCOUNT_KEY='...'

# Ou procure o erro em server/firebaseAdmin.ts
```

### Erro: "Cannot read property 'collection'"

Significa que `getFirestore()` retornou `undefined`. Verifique:
1. Firebase foi inicializado com `initializeFirebase()`
2. SERVICE_ACCOUNT_KEY está válida

### Erro: "Timestamp is not a constructor"

Verifique que importou corretamente:
```typescript
import { Timestamp } from './firebaseAdmin';
```

---

## 📈 Performance

### Teste de Carga Leve

```typescript
// server/test-firestore-load.ts
async function testLoad() {
  const storage = new FirestoreStorage();

  console.time('Create 10 users');
  for (let i = 0; i < 10; i++) {
    await storage.createUser({
      nome: `User ${i}`,
      cpf: `${String(i).padStart(11, '0')}`,
      email: `user${i}@test.local`,
      senha: 'hashed',
      tipo: 'empregado',
      ativo: true,
      primeiro_acesso: true,
    });
  }
  console.timeEnd('Create 10 users');

  console.time('Query all users');
  await storage.getAllEmployees();
  console.timeEnd('Query all users');
}

testLoad();
```

### Executar

```bash
npx ts-node server/test-firestore-load.ts
```

---

## 🔄 Próximos Passos

### Se Tudo OK:

1. ✅ Proceder para Fase 3 (Migração de Dados)
2. ✅ Escrever scripts Postgres → Firestore

### Se Há Erros:

1. ❌ Debugar usando checklist acima
2. ❌ Verificar logs em `console.error`
3. ❌ Conferir índices do Firestore
4. ❌ Validar SERVICE_ACCOUNT_KEY

---

## 💡 Dicas

1. **Use emulator para dev**
   - Sem custos
   - Dados resetam ao reiniciar
   - Rápido e seguro

2. **Use produção para integração**
   - Após validação com emulator
   - Dados reais
   - Teste com cuidado

3. **Limpe dados de teste**
   ```bash
   # Via Firebase Console: delete collection
   # Ou via CLI:
   npx firebase firestore:delete users --recursive
   ```

4. **Monitore custos**
   - Free tier: 50K leituras/dia
   - Você usa: ~2-5K/dia
   - Margem: 10x

---

## 📞 Troubleshooting Rápido

| Erro | Causa | Solução |
|------|-------|---------|
| "Permission denied" | Rules | Usar emulator ou Admin SDK |
| "Document not found" | Query errada | Verificar Firestore Console |
| "Timeout" | Emulator não rodando | `npx firebase emulators:start` |
| "Bad JSON" | SERVICE_ACCOUNT_KEY inválida | Copiar novamente do Firebase |

---

**Status:** ✅ Fase 2 Completa (Testes prontos)

Próxima ação: Rodar testes e validar que tudo funciona!
