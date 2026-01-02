# Fase 3 — Substituição Postgres → Firestore (Completa)

## Resumo

A migração foi simplificada pois o banco Postgres está vazio. Em vez de migrar dados, apenas:

1. ✅ Criado `server/firebaseStorage.ts` — implementação completa de Firestore (20+ métodos).
2. ✅ Atualizado `server/storage.ts` — agora exporta `FirestoreStorage` como padrão.
3. ✅ Atualizado `tsconfig.json` — adicionado alias `@server/*` para imports.
4. ⏭️ Security Rules e Indexes (próximas seções).

## Mudanças de código

### server/storage.ts
- Agora importa e exporta `FirestoreStorage` por padrão.
- `PostgresStorage` e `MemStorage` mantidas como referência.

```typescript
import FirestoreStorage from './firebaseStorage';
export const storage = new FirestoreStorage();
```

### Estrutura Firestore

Collections criadas automaticamente ao primeiro write:

- **users** — usuários (admin + empregados)
  - Campo: id, cpf, nome, senha, tipo, ativo, email, telefone, data_nascimento, data_inicio, carga_horaria, tipo_contrato, primeiro_acesso, created_at

- **workSchedules** — horários de trabalho
  - Campo: id, empregado_id, dia_semana, hora_inicio, hora_fim, intervalo_inicio, intervalo_fim

- **timeRecords** — registros de ponto
  - Campo: id, empregado_id, data, hora_entrada, hora_intervalo, hora_retorno, hora_saida, observacao, localizacao_*, created_at

## Próximas etapas (Fase 4)

### 1. Security Rules (firestore.rules)

Criar arquivo `firestore.rules` com:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admins podem ler/escrever tudo
    match /{document=**} {
      allow read, write: if hasRole('admin');
    }
    
    // Usuários logados podem ler seus próprios registros
    match /users/{userId} {
      allow read: if isLoggedIn() && request.auth.uid == userId || hasRole('admin');
      allow write: if false; // Apenas servidor cria/atualiza
    }
    
    match /workSchedules/{docId} {
      allow read: if isLoggedIn();
      allow write: if hasRole('admin');
    }
    
    match /timeRecords/{docId} {
      allow read: if isLoggedIn();
      allow write: if isLoggedIn(); // Empregados podem registrar ponto
    }
    
    // Helpers
    function isLoggedIn() {
      return request.auth != null;
    }
    
    function hasRole(role) {
      return isLoggedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tipo == role;
    }
  }
}
```

Deploy com:
```bash
firebase deploy --only firestore:rules
```

### 2. Firestore Indexes

Firestore criará indexes automaticamente para queries complexas. Se necessário, criar manualmente:

- Índice para `timeRecords`: (empregado_id, data)
- Índice para `timeRecords`: (data, empregado_id)
- Índice para `users`: (tipo, ativo)

Ou deixar Firestore sugerir quando rodar queries.

### 3. Variáveis de ambiente

Garantir que `.env.local` tem:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
SERVICE_ACCOUNT_KEY={...}
DATABASE_URL=... (opcional, Postgres não mais necessário)
```

### 4. Testes

Executar a app e validar:

```bash
npm run dev
```

Testar endpoints:
- POST /api/auth/login (email + senha via Firebase)
- GET /api/users (lista empregados)
- POST /api/time-records (registrar ponto)
- GET /api/time-records/:date (listar ponto do dia)

### 5. Monitoramento

- Verificar logs do Firestore no Console do Firebase.
- Configurar alertas para custos se necessário.
- Backups automáticos habilitados (padrão no Firestore).

## Resultado

✅ App agora usa **Firestore como storage primário**.
✅ Firebase Auth para autenticação.
✅ Firestore oferece escalabilidade horizontal, backups automáticos e segurança nativa.
✅ Postgres pode ser descontinuado se necessário (mas `PostgresStorage` ainda funciona para fallback).

---

**Próximo:** Criar `firestore.rules` e `firestore.indexes.json`, depois deploy em produção.
