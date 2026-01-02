import 'dotenv/config';
import FirestoreStorage from '../firebaseStorage';

/**
 * Inicializa Firestore e popula dados de exemplo (opcional).
 * Por padrão apenas garante que o admin exista.
 * Para inserir exemplos: export SEED_SAMPLE=true
 *
 * Uso:
 *   npx ts-node server/migrate/seed-firestore.ts
 */

async function main() {
  const storage = new FirestoreStorage();

  console.log('Inicializando Firestore (cria admin se necessário)');
  await storage.initializeDb();

  const seedSample = process.env.SEED_SAMPLE === 'true';
  if (!seedSample) {
    console.log('Pronto — admin criado/confirmado. Para popular exemplos, export SEED_SAMPLE=true e rode novamente.');
    process.exit(0);
  }

  // Verificar se já existem empregados
  const employees = await storage.getAllEmployees();
  if (employees.length > 0) {
    console.log('Coleção users já contém empregados; abortando criação de exemplos.');
    process.exit(0);
  }

  console.log('Criando usuários de exemplo...');
  const alice = await storage.createUser({
    nome: 'Alice Exemplo',
    cpf: '11111111111',
    senha: 'senha123',
    tipo: 'empregado',
    ativo: true,
    email: 'alice@example.com',
    primeiro_acesso: false,
  });

  const bob = await storage.createUser({
    nome: 'Bob Exemplo',
    cpf: '22222222222',
    senha: 'senha123',
    tipo: 'empregado',
    ativo: true,
    email: 'bob@example.com',
    primeiro_acesso: false,
  });

  console.log('Criando horários de trabalho de exemplo...');
  await storage.createWorkSchedule({
    empregado_id: alice.id,
    dia_semana: 'segunda',
    hora_inicio: '08:00:00',
    hora_fim: '17:00:00',
  });

  await storage.createWorkSchedule({
    empregado_id: bob.id,
    dia_semana: 'terça',
    hora_inicio: '09:00:00',
    hora_fim: '18:00:00',
  });

  console.log('Criando registros de ponto de exemplo...');
  await storage.createTimeRecord({
    empregado_id: alice.id,
    data: new Date().toISOString().split('T')[0],
    hora_entrada: new Date(),
    hora_saida: new Date(),
  });

  await storage.createTimeRecord({
    empregado_id: bob.id,
    data: new Date().toISOString().split('T')[0],
    hora_entrada: new Date(),
    hora_saida: new Date(),
  });

  console.log('Seed concluído.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
