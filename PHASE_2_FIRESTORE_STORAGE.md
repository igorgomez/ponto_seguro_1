# Fase 2: Migração Storage → Firestore

## 📋 Resumo

Fase 2 implementa `FirestoreStorage` como alternativa ao `PostgresStorage`, mantendo a mesma interface `IStorage`.

**Objetivo:** Permitir transição do PostgreSQL para Firestore sem quebrar o código existente.

---

## ✅ O Que Foi Implementado

### Arquivo Novo

**`server/firebaseStorage.ts`** (450+ linhas)
- Classe `FirestoreStorage` implementando `IStorage`
- Todos os 20+ métodos necessários
- Suporte para Timestamps do Firestore
- Tratamento de erros completo

---

## 🏗️ Estrutura Firestore (Collections)

```
firestore.google.com
├── users/
│   ├── user_1
│   │   ├── id: 1
│   │   ├── cpf: "12345678901"
│   │   ├── nome: "João Silva"
│   │   ├── email: "joao@example.com"
│   │   ├── tipo: "empregado" | "admin"
│   │   ├── ativo: true
│   │   ├── primeiro_acesso: true
│   │   ├── created_at: Timestamp
│   │   └── ... (outros campos)
│   ├── user_2
│   └── ...
│
├── workSchedules/
│   ├── schedule_1
│   │   ├── id: 1
│   │   ├── empregado_id: 1
│   │   ├── dia_semana: "segunda"
│   │   ├── hora_inicio: "08:00"
│   │   ├── hora_fim: "17:00"
│   │   └── ...
│   └── ...
│
└── timeRecords/
    ├── record_1
    │   ├── id: 1
    │   ├── empregado_id: 1
    │   ├── data: "2026-01-02"
    │   ├── hora_entrada: Timestamp
    │   ├── hora_intervalo: Timestamp
    │   ├── hora_retorno: Timestamp
    │   ├── hora_saida: Timestamp
    │   ├── created_at: Timestamp
    │   └── ...
    └── ...
```

---

## 🔄 Como Usar

### Opção 1: Manter PostgreSQL + Firestore em Paralelo

```typescript
// server/index.ts
import { storage } from './storage'; // PostgresStorage (padrão)

// Tudo continua funcionando normalmente
await storage.initializeDb();
```

### Opção 2: Trocar para Firestore

```typescript
// server/index.ts
import FirestoreStorage from './firebaseStorage';

const storage = new FirestoreStorage();
await storage.initializeDb();
```

**Alternativa com ENV:**

```bash
# .env
STORAGE_TYPE=firestore  # ou "postgres"
```

```typescript
// server/index.ts
const storage = process.env.STORAGE_TYPE === 'firestore' 
  ? new FirestoreStorage() 
  : new PostgresStorage();
```

---

## 📊 Comparação: PostgreSQL vs Firestore

| Aspecto | PostgreSQL | Firestore |
|---------|-----------|-----------|
| **Queries simples** | `WHERE id = 1` | `where('id', '==', 1)` |
| **Múltiplos WHEREs** | `WHERE id = 1 AND tipo = 'admin'` | `where('id', '==', 1).where('tipo', '==', 'admin')` |
| **Transactions** | `BEGIN ... COMMIT` | `batch.commit()` |
| **Índices** | Automáticos | Configurar manualmente |
| **Escalabilidade** | Manual (DB size) | Automática |
| **Custo** | ~$10-20/mês | ~$0-5/mês |
| **Relacionamentos** | JOINs nativos | Múltiplas queries |

---

## ⚙️ Configuração Necessária

### 1. Criar Índices no Firestore (importante para performance)

```
Firebase Console → Firestore → Índices
```

**Índices recomendados:**

- **Collection: users**
  - `cpf` (Ascending)
  - `email` (Ascending)
  - `firebase_uid` (Ascending)
  - `tipo` (Ascending)

- **Collection: workSchedules**
  - `empregado_id` (Ascending)

- **Collection: timeRecords**
  - `empregado_id` (Ascending), `data` (Descending)
  - `data` (Ascending)
  - `created_at` (Descending)

### 2. Configurar Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Padrão: negar tudo
    match /{document=**} {
      allow read, write: if false;
    }

    // Users: apenas servidor (via Admin SDK)
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                           request.auth.token.admin == true;
    }

    // WorkSchedules: apenas servidor
    match /workSchedules/{scheduleId} {
      allow read, write: if request.auth != null && 
                           request.auth.token.admin == true;
    }

    // TimeRecords: apenas servidor
    match /timeRecords/{recordId} {
      allow read, write: if request.auth != null && 
                           request.auth.token.admin == true;
    }
  }
}
```

---

## 🚀 Passos para Migração (Gradual)

### FASE 2A: Preparação (Agora)

- [x] Criar `firebaseStorage.ts`
- [x] Implementar todos os métodos `IStorage`
- [ ] Testar localmente com Firestore

### FASE 2B: Testes

- [ ] Criar dados de teste no Firestore
- [ ] Verificar queries funcionam
- [ ] Comparar performance com PostgreSQL
- [ ] Validar Timestamps

### FASE 3: Migração de Dados

- [ ] Script Postgres → Firestore
- [ ] Validação de integridade
- [ ] Backup de segurança

### FASE 4: Go-Live

- [ ] Trocar para `FirestoreStorage` em produção
- [ ] Monitorar logs/performance
- [ ] Manter PostgreSQL como fallback

---

## 🧪 Como Testar Localmente

### 1. Usar Firestore Emulator (recomendado)

```bash
# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Iniciar emulator
firebase emulators:start --only firestore

# Em outro terminal
export FIRESTORE_EMULATOR_HOST=localhost:8080
npm run dev
```

### 2. Usar Firestore Produção (com dados de teste)

```typescript
// Criar usuário de teste
const firestore = new FirestoreStorage();
const user = await firestore.createUser({
  nome: 'Teste',
  cpf: '12345678901',
  email: 'test@example.com',
  senha: 'hashed_password',
  tipo: 'empregado',
  ativo: true,
  primeiro_acesso: true,
});
console.log('Created user:', user);
```

---

## 📈 Performance

### Estimativa de Custos Firestore

```
Leitura: $0.06 / 100,000 leituras
Escrita: $0.18 / 100,000 escritas

Seu volume (estimado):
- Logins: 100-500/dia = 3-15K/mês
- Queries de dados: 500-1000/dia = 15-30K/mês
- Escritas (ponto): 1000-5000/dia = 30-150K/mês

CUSTO ESTIMADO: $1-5/mês (muito barato)
```

---

## ⚠️ Considerações

### Vantagens de Firestore

✅ Sem gerenciamento de infraestrutura  
✅ Escalabilidade automática  
✅ Backup automático  
✅ Muito barato para small/medium volume  
✅ Real-time listeners (futuro)  

### Desvantagens de Firestore

❌ Queries limitadas (sem JOINs)  
❌ Múltiplas queries para relacionamentos  
❌ Índices devem ser criados manualmente  
❌ Limite de 20K documentos por transaction  
❌ Timestamps sempre em UTC  

---

## 🔄 Como Mudar Entre Storage

### Opção 1: Factory Pattern (Recomendado)

```typescript
// server/storageFactory.ts
import { IStorage } from './storage';
import { PostgresStorage } from './storage';
import FirestoreStorage from './firebaseStorage';

export function createStorage(): IStorage {
  const storageType = process.env.STORAGE_TYPE || 'postgres';
  
  if (storageType === 'firestore') {
    return new FirestoreStorage();
  }
  
  return new PostgresStorage();
}
```

```typescript
// server/index.ts
import { createStorage } from './storageFactory';

const storage = createStorage();
```

### Opção 2: Variável de Ambiente

```bash
# .env
STORAGE_TYPE=firestore
```

---

## 📝 Checklist Fase 2

**Pré-requisitos:**
- [ ] Fase 1 (Firebase Auth) funcionando
- [ ] `firebase-admin` instalado
- [ ] Firestore habilitado no Firebase

**Implementação:**
- [x] Criar `firebaseStorage.ts`
- [ ] Testar cada método individualmente
- [ ] Validar Timestamps
- [ ] Verificar tratamento de erros

**Testes:**
- [ ] Login funciona com Firestore
- [ ] Criar usuário funciona
- [ ] Buscar usuário funciona
- [ ] Atualizar usuário funciona
- [ ] Remover trabalho schedules funciona
- [ ] Criar time records funciona
- [ ] Buscar time records por date funciona
- [ ] Endpoints de negócio funcionam

**Go-Live:**
- [ ] Migração de dados completa
- [ ] Backup PostgreSQL pronto
- [ ] Monitoring configurado
- [ ] Plano de rollback pronto

---

## 🎯 Próximos Passos

### Imediato (Fase 2B):

1. Criar dados de teste no Firestore
2. Testar cada método de `FirestoreStorage`
3. Validar performance vs PostgreSQL
4. Criar índices no Firestore

### Depois (Fase 3):

1. Escrever scripts de migração (Postgres → Firestore)
2. Validar integridade dos dados
3. Testar rollback

### Finally (Fase 4):

1. Trocar para `FirestoreStorage` em produção
2. Monitorar performance
3. Remover PostgreSQL (depois de semanas estável)

---

## 📚 Documentação

- [Firestore Docs](https://cloud.google.com/firestore/docs)
- [Firestore Query Docs](https://cloud.google.com/firestore/docs/query-data/queries)
- [Firestore Pricing](https://cloud.google.com/firestore/pricing)

---

**Status:** ✅ Fase 2A Completa (Código implementado)

Próxima ação: Testar `FirestoreStorage` localmente antes de Fase 3 (migração de dados).
