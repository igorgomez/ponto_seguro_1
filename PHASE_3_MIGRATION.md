# Fase 3 — Migração Postgres → Firestore

Este documento descreve o plano, passos e comandos para migrar dados do banco PostgreSQL (Drizzle) para Firestore.

## Objetivo

1. Fazer backup completo dos dados críticos.
2. Executar migração em modo dry-run e validar.
3. Executar migração real (EXECUTE) após validação.

## Arquivos adicionados

- server/migrate/backup-postgres.ts — exporta users, work_schedules, time_records para server/migrate/backups/*.json.
- server/migrate/postgres-to-firestore.ts — script de migração com DRY-RUN por padrão. Para executar realmente, setar FIRESTORE_MIGRATE_EXECUTE=true.

## Pré-requisitos

- Variáveis de ambiente: SERVICE_ACCOUNT_KEY, DATABASE_URL (ou configuração usada pelo server/db.ts).
- Ter firebase-admin instalado (já presente nas fases anteriores).
- Recomenda-se usar o Firestore Emulator para testes.

## Passos recomendados


Observação importante: o banco Postgres está vazio e não será necessário migrar dados.
Em vez disso, inicializaremos Firestore do zero. Use os scripts abaixo.

1. Backup (opcional — útil se houver dados):

   npx ts-node server/migrate/backup-postgres.ts

2. Inicializar Firestore (cria admin padrão):

   npx ts-node server/migrate/seed-firestore.ts

3. Popular dados de exemplo (opcional):

   export SEED_SAMPLE=true
   npx ts-node server/migrate/seed-firestore.ts

4. Validar: executar `server/test-firestore-storage.ts` e verificar coleções no Console do Firebase.

5. Depois: configurar regras de segurança e indexes antes de ir para produção.

## Rollback

- Em caso de problemas, restaure do backup JSON para Postgres (procedimento DB específico).

## Notas

- Os scripts fornecidos têm queries SQL genéricas; adapte-as ao seu schema (nomes/colunas).
- Verifique constraints, referências e normalizações que requerem transformação antes de inserir no Firestore.
