import 'dotenv/config';
import { pool } from '../db';
import fs from 'fs';
import path from 'path';

/**
 * Exporta dados críticos do Postgres para JSON como backup antes da migração.
 * Uso:
 *   npx ts-node server/migrate/backup-postgres.ts
 */

async function main() {
  const pg = pool;
  const outDir = path.resolve(process.cwd(), 'server', 'migrate', 'backups');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tables = ['users', 'work_schedules', 'time_records'];
  for (const t of tables) {
    const res = await pg.query(`SELECT * FROM ${t} ORDER BY id`);
    const file = path.join(outDir, `${t}.json`);
    fs.writeFileSync(file, JSON.stringify(res.rows, null, 2), 'utf8');
    console.log(`Exportado ${res.rowCount} linhas de ${t} → ${file}`);
  }

  console.log('Backup concluído em', outDir);
  process.exit(0);
}

main().catch((err) => {
  console.error('Erro no backup:', err);
  process.exit(1);
});
