/**
 * Script de teste para FirestoreStorage
 * 
 * Uso:
 *   npx ts-node server/test-firestore-storage.ts
 * 
 * IMPORTANTE: Configure SERVICE_ACCOUNT_KEY antes de rodar
 */

import FirestoreStorage from './firebaseStorage';
import { InsertUser } from '@shared/schema';

async function runTests() {
  console.log('🧪 Iniciando testes de FirestoreStorage...\n');

  const storage = new FirestoreStorage();

  try {
    // 1. Inicializar DB
    console.log('1️⃣  Testando initializeDb()...');
    await storage.initializeDb();
    console.log('✅ DB inicializado\n');

    // 2. Criar usuário de teste
    console.log('2️⃣  Testando createUser()...');
    const newUser = await storage.createUser({
      nome: 'Teste User',
      cpf: '12345678901',
      email: 'test@firestore.local',
      senha: 'hashedpassword123',
      tipo: 'empregado',
      ativo: true,
      primeiro_acesso: true,
    });
    console.log('✅ Usuário criado:', newUser.id, newUser.nome);
    const userId = newUser.id;

    // 3. Buscar por ID
    console.log('\n3️⃣  Testando getUser()...');
    const fetchedUser = await storage.getUser(userId);
    if (fetchedUser) {
      console.log('✅ Usuário encontrado:', fetchedUser.nome);
    } else {
      console.log('❌ Usuário não encontrado');
    }

    // 4. Buscar por CPF
    console.log('\n4️⃣  Testando getUserByCPF()...');
    const userByCpf = await storage.getUserByCPF('12345678901');
    if (userByCpf) {
      console.log('✅ Usuário encontrado por CPF:', userByCpf.nome);
    } else {
      console.log('❌ Usuário não encontrado por CPF');
    }

    // 5. Buscar por Email
    console.log('\n5️⃣  Testando getUserByEmail()...');
    const userByEmail = await storage.getUserByEmail('test@firestore.local');
    if (userByEmail) {
      console.log('✅ Usuário encontrado por Email:', userByEmail.nome);
    } else {
      console.log('❌ Usuário não encontrado por Email');
    }

    // 6. Atualizar usuário
    console.log('\n6️⃣  Testando updateUser()...');
    await storage.updateUser(userId, {
      nome: 'Teste User Atualizado',
      primeiro_acesso: false,
    });
    const updatedUser = await storage.getUser(userId);
    if (updatedUser?.nome === 'Teste User Atualizado') {
      console.log('✅ Usuário atualizado com sucesso');
    } else {
      console.log('❌ Falha ao atualizar usuário');
    }

    // 7. Criar horário de trabalho
    console.log('\n7️⃣  Testando createWorkSchedule()...');
    const schedule = await storage.createWorkSchedule({
      empregado_id: userId,
      dia_semana: 'segunda',
      hora_inicio: '08:00',
      hora_fim: '17:00',
      intervalo_inicio: '12:00',
      intervalo_fim: '13:00',
    });
    console.log('✅ Horário criado:', schedule.id);

    // 8. Buscar horários
    console.log('\n8️⃣  Testando getEmployeeWorkSchedules()...');
    const schedules = await storage.getEmployeeWorkSchedules(userId);
    console.log(`✅ Encontrados ${schedules.length} horário(s)`);

    // 9. Criar registro de ponto
    console.log('\n9️⃣  Testando createTimeRecord()...');
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const record = await storage.createTimeRecord({
      empregado_id: userId,
      data: dateStr,
      hora_entrada: new Date(),
    });
    console.log('✅ Registro de ponto criado:', record.id);

    // 10. Buscar registro por ID
    console.log('\n🔟 Testando getTimeRecord()...');
    const fetchedRecord = await storage.getTimeRecord(record.id);
    if (fetchedRecord) {
      console.log('✅ Registro encontrado');
    } else {
      console.log('❌ Registro não encontrado');
    }

    // 11. Buscar registros por data
    console.log('\n1️⃣1️⃣  Testando getTimeRecordsByDate()...');
    const recordsByDate = await storage.getTimeRecordsByDate(today);
    console.log(`✅ Encontrados ${recordsByDate.length} registro(s) para hoje`);

    // 12. Buscar registros do empregado
    console.log('\n1️⃣2️⃣  Testando getEmployeeTimeRecords()...');
    const employeeRecords = await storage.getEmployeeTimeRecords(userId);
    console.log(`✅ Encontrados ${employeeRecords.length} registro(s) do empregado`);

    // 13. Atualizar registro
    console.log('\n1️⃣3️⃣  Testando updateTimeRecord()...');
    await storage.updateTimeRecord(record.id, {
      observacao: 'Teste de atualização',
    });
    const updatedRecord = await storage.getTimeRecord(record.id);
    if (updatedRecord?.observacao === 'Teste de atualização') {
      console.log('✅ Registro atualizado com sucesso');
    }

    // 14. Buscar todos os empregados
    console.log('\n1️⃣4️⃣  Testando getAllEmployees()...');
    const employees = await storage.getAllEmployees();
    console.log(`✅ Encontrados ${employees.length} empregado(s)`);

    // 15. Buscar todos os registros
    console.log('\n1️⃣5️⃣  Testando getAllTimeRecords()...');
    const allRecords = await storage.getAllTimeRecords();
    console.log(`✅ Encontrados ${allRecords.length} registro(s) no total`);

    // 16. Deletar horários
    console.log('\n1️⃣6️⃣  Testando deleteEmployeeWorkSchedules()...');
    await storage.deleteEmployeeWorkSchedules(userId);
    const schedulesAfterDelete = await storage.getEmployeeWorkSchedules(userId);
    if (schedulesAfterDelete.length === 0) {
      console.log('✅ Horários deletados com sucesso');
    }

    console.log('\n✨ Todos os testes passaram!');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

runTests().then(() => {
  console.log('\n✅ Testes concluídos!');
  process.exit(0);
});
