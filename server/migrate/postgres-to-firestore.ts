import 'dotenv/config';
import { getFirestore, Timestamp } from '../firebaseAdmin';
import { pool } from '../db';

/**
 * Script de migração: Postgres -> Firestore
 * - Modo dry-run (default): apenas loga o que seria enviado
 * - Para executar realmente: set FIRESTORE_MIGRATE_EXECUTE=true
 *
 * Uso:
 *   npx ts-node server/migrate/postgres-to-firestore.ts
 */

const EXECUTE = process.env.FIRESTORE_MIGRATE_EXECUTE === 'true';

async function main() {
  console.log('Iniciando migração Postgres → Firestore', EXECUTE ? '(EXECUTE)' : '(DRY-RUN)');

  const firestore = getFirestore();

  // Queries adaptadas ao schema atual (ver shared/schema.ts)
  const usersRes = await pool.query(`SELECT id, cpf, nome, senha, tipo, ativo, email, telefone, data_nascimento, data_inicio, carga_horaria, tipo_contrato, primeiro_acesso, created_at FROM users ORDER BY id`);
  const workSchedulesRes = await pool.query(`SELECT id, empregado_id, dia_semana, hora_inicio, hora_fim, intervalo_inicio, intervalo_fim FROM work_schedules ORDER BY id`);
  const timeRecordsRes = await pool.query(`SELECT id, empregado_id, data, hora_entrada, hora_intervalo, hora_retorno, hora_saida, observacao, localizacao_entrada, localizacao_intervalo, localizacao_retorno, localizacao_saida, created_at FROM time_records ORDER BY id`);

  console.log(`Encontrados: users=${usersRes.rowCount}, workSchedules=${workSchedulesRes.rowCount}, timeRecords=${timeRecordsRes.rowCount}`);

  // Mapeamento básico — adapte campos à sua modelagem
  for (const u of usersRes.rows) {
    const docRef = firestore.collection('users').doc(String(u.id));
    const payload = {
      id: u.id,
      cpf: u.cpf || null,
      nome: u.nome || null,
      senha: u.senha || null,
      tipo: u.tipo || 'empregado',
      ativo: u.ativo ?? true,
      email: u.email || null,
      telefone: u.telefone || null,
      data_nascimento: u.data_nascimento || null,
      data_inicio: u.data_inicio || null,
      carga_horaria: u.carga_horaria || null,
      tipo_contrato: u.tipo_contrato || null,
      primeiro_acesso: u.primeiro_acesso ?? true,
      created_at: u.created_at ? Timestamp.fromDate(new Date(u.created_at)) : Timestamp.now(),
    };

    if (EXECUTE) {
      await docRef.set(payload, { merge: true });
      console.log(`Migrado user id=${u.id}`);
    } else {
      console.log('[DRY-RUN] user ->', payload);
    }
  }

  for (const s of workSchedulesRes.rows) {
    const docRef = firestore.collection('workSchedules').doc(String(s.id));
    const payload = {
      id: s.id,
      empregado_id: s.empregado_id,
      dia_semana: s.dia_semana,
      hora_inicio: s.hora_inicio,
      hora_fim: s.hora_fim,
      intervalo_inicio: s.intervalo_inicio || null,
      intervalo_fim: s.intervalo_fim || null,
    };
    if (EXECUTE) {
      await docRef.set(payload, { merge: true });
      console.log(`Migrado schedule id=${s.id}`);
    } else {
      console.log('[DRY-RUN] schedule ->', payload);
    }
  }

  for (const r of timeRecordsRes.rows) {
    const docRef = firestore.collection('timeRecords').doc(String(r.id));
    const payload = {
      id: r.id,
      empregado_id: r.empregado_id,
      data: r.data ? (r.data instanceof Date ? r.data.toISOString().split('T')[0] : r.data) : null,
      hora_entrada: r.hora_entrada ? Timestamp.fromDate(new Date(r.hora_entrada)) : null,
      hora_intervalo: r.hora_intervalo ? Timestamp.fromDate(new Date(r.hora_intervalo)) : null,
      hora_retorno: r.hora_retorno ? Timestamp.fromDate(new Date(r.hora_retorno)) : null,
      hora_saida: r.hora_saida ? Timestamp.fromDate(new Date(r.hora_saida)) : null,
      observacao: r.observacao || null,
      localizacao_entrada: r.localizacao_entrada || null,
      localizacao_intervalo: r.localizacao_intervalo || null,
      localizacao_retorno: r.localizacao_retorno || null,
      localizacao_saida: r.localizacao_saida || null,
      created_at: r.created_at ? Timestamp.fromDate(new Date(r.created_at)) : Timestamp.now(),
    };
    if (EXECUTE) {
      await docRef.set(payload, { merge: true });
      console.log(`Migrado timeRecord id=${r.id}`);
    } else {
      console.log('[DRY-RUN] timeRecord ->', payload);
    }
  }

  console.log('Migração concluída (modo:', EXECUTE ? 'EXECUTE' : 'DRY-RUN', ')');
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
