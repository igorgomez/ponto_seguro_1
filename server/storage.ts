import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { users, workSchedules, timeRecords, type User, type InsertUser, type WorkSchedule, type InsertWorkSchedule, type TimeRecord, type InsertTimeRecord } from "@shared/schema";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByCPF(cpf: string): Promise<User | undefined>;
  getAdminUser(): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<void>;
  getAllEmployees(): Promise<User[]>;
  
  // Work schedule operations
  getEmployeeWorkSchedules(employeeId: number): Promise<WorkSchedule[]>;
  createWorkSchedule(schedule: InsertWorkSchedule): Promise<WorkSchedule>;
  deleteEmployeeWorkSchedules(employeeId: number): Promise<void>;
  
  // Time record operations
  getTimeRecord(id: number): Promise<TimeRecord | undefined>;
  getTimeRecordsByDate(date: Date): Promise<TimeRecord[]>;
  getEmployeeTimeRecords(employeeId: number): Promise<TimeRecord[]>;
  getEmployeeTimeRecordByDate(employeeId: number, date: Date): Promise<TimeRecord | undefined>;
  getAllTimeRecords(): Promise<TimeRecord[]>;
  getRecentTimeRecords(limit: number): Promise<TimeRecord[]>;
  createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord>;
  updateTimeRecord(id: number, updates: Partial<TimeRecord>): Promise<void>;
  
  // Inicialização e configuração
  initializeDb(): Promise<void>;
}

// Classe de armazenamento de dados em PostgreSQL
export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private migrationClient: postgres.Sql;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não definida");
    }
    
    this.migrationClient = postgres(process.env.DATABASE_URL, { ssl: 'prefer' });
    this.db = drizzle(this.migrationClient);
  }

  async initializeDb(): Promise<void> {
    try {
      // Executa as migrações
      // Nota: na produção, é melhor gerenciar migrações separadamente
      await migrate(this.db, { migrationsFolder: "migrations" });
      console.log("Migrações aplicadas com sucesso");
    } catch (error) {
      console.error("Erro ao aplicar migrações:", error);
      
      // Se o erro for devido a tabelas não existentes, vamos criá-las diretamente
      try {
        console.log("Tentando criar tabelas diretamente...");
        await this.db.execute(sql`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            cpf TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            tipo TEXT NOT NULL,
            ativo BOOLEAN NOT NULL DEFAULT TRUE,
            email TEXT,
            telefone TEXT,
            primeiro_acesso BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS work_schedules (
            id SERIAL PRIMARY KEY,
            empregado_id INTEGER NOT NULL REFERENCES users(id),
            dia_semana TEXT NOT NULL,
            hora_inicio TIME NOT NULL,
            hora_fim TIME NOT NULL,
            intervalo_inicio TIME,
            intervalo_fim TIME
          );

          CREATE TABLE IF NOT EXISTS time_records (
            id SERIAL PRIMARY KEY,
            empregado_id INTEGER NOT NULL REFERENCES users(id),
            data DATE NOT NULL,
            hora_entrada TIMESTAMP,
            hora_intervalo TIMESTAMP,
            hora_retorno TIMESTAMP,
            hora_saida TIMESTAMP,
            observacao TEXT,
            localizacao_entrada JSON,
            localizacao_intervalo JSON,
            localizacao_retorno JSON,
            localizacao_saida JSON,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log("Tabelas criadas com sucesso");
      } catch (createError) {
        console.error("Erro ao criar tabelas:", createError);
        throw createError;
      }
    }

    // Verifica se já existe um usuário administrador
    const adminUser = await this.getAdminUser();
    if (!adminUser) {
      // Cria um usuário administrador padrão
      const adminData: InsertUser = {
        nome: "Administrador",
        cpf: "00000000000",
        senha: "$2b$10$Xt5/dSc6xBHa/r9b0h/3ieflh/XKaJR9kkQSCMAGnB36YMDyZBnrO", // senha123
        tipo: "admin",
        email: "admin@example.com",
        ativo: true,
        primeiro_acesso: false
      };
      
      try {
        await this.createUser(adminData);
        console.log("Usuário administrador padrão criado");
      } catch (error) {
        console.error("Erro ao criar usuário administrador:", error);
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      senha: users.senha,
      tipo: users.tipo,
      ativo: users.ativo,
      email: users.email,
      telefone: users.telefone,
      primeiro_acesso: users.primeiro_acesso,
      created_at: users.created_at,
      data_nascimento: users.data_nascimento,
      data_inicio: users.data_inicio,
      carga_horaria: users.carga_horaria,
      tipo_contrato: users.tipo_contrato
    }).from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByCPF(cpf: string): Promise<User | undefined> {
    const result = await this.db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      senha: users.senha,
      tipo: users.tipo,
      ativo: users.ativo,
      email: users.email,
      telefone: users.telefone,
      primeiro_acesso: users.primeiro_acesso,
      created_at: users.created_at,
      data_nascimento: users.data_nascimento,
      data_inicio: users.data_inicio,
      carga_horaria: users.carga_horaria,
      tipo_contrato: users.tipo_contrato
    }).from(users).where(eq(users.cpf, cpf));
    return result[0];
  }

  async getAdminUser(): Promise<User | undefined> {
    const result = await this.db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      senha: users.senha,
      tipo: users.tipo,
      ativo: users.ativo,
      email: users.email,
      telefone: users.telefone,
      primeiro_acesso: users.primeiro_acesso,
      created_at: users.created_at,
      data_nascimento: users.data_nascimento,
      data_inicio: users.data_inicio,
      carga_horaria: users.carga_horaria,
      tipo_contrato: users.tipo_contrato
    }).from(users).where(eq(users.tipo, "admin"));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Preparamos o objeto para não incluir os campos novos se não fornecidos
    const userData: InsertUser = {
      cpf: insertUser.cpf,
      nome: insertUser.nome,
      senha: insertUser.senha,
      tipo: insertUser.tipo || "empregado",
      ativo: insertUser.ativo !== undefined ? insertUser.ativo : true,
      email: insertUser.email || null,
      telefone: insertUser.telefone || null,
      primeiro_acesso: insertUser.primeiro_acesso !== undefined ? insertUser.primeiro_acesso : true
    };
    
    // Adicionamos os campos novos apenas se estiverem presentes
    if (insertUser.data_nascimento) userData.data_nascimento = insertUser.data_nascimento;
    if (insertUser.data_inicio) userData.data_inicio = insertUser.data_inicio;
    if (insertUser.carga_horaria) userData.carga_horaria = insertUser.carga_horaria;
    if (insertUser.tipo_contrato) userData.tipo_contrato = insertUser.tipo_contrato;
    
    const result = await this.db.insert(users).values(userData).returning({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      senha: users.senha,
      tipo: users.tipo,
      ativo: users.ativo,
      email: users.email,
      telefone: users.telefone,
      primeiro_acesso: users.primeiro_acesso,
      created_at: users.created_at,
      data_nascimento: users.data_nascimento,
      data_inicio: users.data_inicio,
      carga_horaria: users.carga_horaria,
      tipo_contrato: users.tipo_contrato
    });
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    // Agora atualizamos todos os campos, incluindo os novos
    await this.db.update(users).set(updates).where(eq(users.id, id));
  }

  async getAllEmployees(): Promise<User[]> {
    return await this.db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      senha: users.senha,
      tipo: users.tipo,
      ativo: users.ativo,
      email: users.email,
      telefone: users.telefone,
      primeiro_acesso: users.primeiro_acesso,
      created_at: users.created_at,
      data_nascimento: users.data_nascimento,
      data_inicio: users.data_inicio,
      carga_horaria: users.carga_horaria,
      tipo_contrato: users.tipo_contrato
    }).from(users).where(eq(users.tipo, "empregado"));
  }

  // Work schedule operations
  async getEmployeeWorkSchedules(employeeId: number): Promise<WorkSchedule[]> {
    return await this.db.select().from(workSchedules).where(eq(workSchedules.empregado_id, employeeId));
  }

  async createWorkSchedule(insertSchedule: InsertWorkSchedule): Promise<WorkSchedule> {
    const result = await this.db.insert(workSchedules).values(insertSchedule).returning();
    return result[0];
  }

  async deleteEmployeeWorkSchedules(employeeId: number): Promise<void> {
    await this.db.delete(workSchedules).where(eq(workSchedules.empregado_id, employeeId));
  }

  // Time record operations
  async getTimeRecord(id: number): Promise<TimeRecord | undefined> {
    const result = await this.db.select().from(timeRecords).where(eq(timeRecords.id, id));
    if (result.length > 0) {
      const record = result[0];
      // Adiciona informações do funcionário
      const employeeResult = await this.db.select({
        id: users.id,
        cpf: users.cpf,
        nome: users.nome,
        senha: users.senha,
        tipo: users.tipo,
        ativo: users.ativo,
        email: users.email,
        telefone: users.telefone,
        primeiro_acesso: users.primeiro_acesso,
        created_at: users.created_at,
        data_nascimento: users.data_nascimento,
        data_inicio: users.data_inicio,
        carga_horaria: users.carga_horaria,
        tipo_contrato: users.tipo_contrato
      }).from(users).where(eq(users.id, record.empregado_id));
      if (employeeResult.length > 0) {
        return {
          ...record,
          employee: employeeResult[0]
        };
      }
      return record;
    }
    return undefined;
  }

  async getTimeRecordsByDate(date: Date): Promise<TimeRecord[]> {
    // Formata a data para comparação (apenas ano-mês-dia)
    const formattedDate = date.toISOString().split('T')[0];
    
    // Consulta registros da data especificada
    const records = await this.db.select().from(timeRecords).where(
      sql`DATE(${timeRecords.data}) = ${formattedDate}`
    );
    
    // Se não houver registros, retorna array vazio
    if (records.length === 0) return [];
    
    // Obtém IDs de funcionários para buscar em lote
    const employeeIds = [...new Set(records.map(r => r.empregado_id))];
    
    // Busca informações dos funcionários em uma única consulta
    const employees = await this.db.select().from(users).where(inArray(users.id, employeeIds));
    
    // Cria um mapa de id -> funcionário para acesso rápido
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    
    // Adiciona informação do funcionário a cada registro
    return records.map(record => ({
      ...record,
      employee: employeeMap.get(record.empregado_id)
    }));
  }

  async getEmployeeTimeRecords(employeeId: number): Promise<TimeRecord[]> {
    return await this.db.select()
      .from(timeRecords)
      .where(eq(timeRecords.empregado_id, employeeId))
      .orderBy(desc(timeRecords.data));
  }

  async getEmployeeTimeRecordByDate(employeeId: number, date: Date): Promise<TimeRecord | undefined> {
    // Formata a data para comparação (apenas ano-mês-dia)
    const formattedDate = date.toISOString().split('T')[0];
    
    const result = await this.db.select().from(timeRecords).where(
      and(
        eq(timeRecords.empregado_id, employeeId),
        sql`DATE(${timeRecords.data}) = ${formattedDate}`
      )
    );
    
    return result[0];
  }

  async getAllTimeRecords(): Promise<TimeRecord[]> {
    const records = await this.db.select()
      .from(timeRecords)
      .orderBy(desc(timeRecords.data));
    
    // Se não houver registros, retorna array vazio
    if (records.length === 0) return [];
    
    // Obtém IDs de funcionários para buscar em lote
    const employeeIds = [...new Set(records.map(r => r.empregado_id))];
    
    // Busca informações dos funcionários em uma única consulta
    const employees = await this.db.select().from(users).where(inArray(users.id, employeeIds));
    
    // Cria um mapa de id -> funcionário para acesso rápido
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    
    // Adiciona informação do funcionário a cada registro
    return records.map(record => ({
      ...record,
      employee: employeeMap.get(record.empregado_id)
    }));
  }

  async getRecentTimeRecords(limit: number): Promise<TimeRecord[]> {
    const records = await this.db.select()
      .from(timeRecords)
      .orderBy(desc(timeRecords.created_at))
      .limit(limit);
    
    // Se não houver registros, retorna array vazio
    if (records.length === 0) return [];
    
    // Obtém IDs de funcionários para buscar em lote
    const employeeIds = [...new Set(records.map(r => r.empregado_id))];
    
    // Busca informações dos funcionários em uma única consulta
    const employees = await this.db.select().from(users).where(inArray(users.id, employeeIds));
    
    // Cria um mapa de id -> funcionário para acesso rápido
    const employeeMap = new Map(employees.map(e => [e.id, e]));
    
    // Adiciona informação do funcionário a cada registro
    return records.map(record => ({
      ...record,
      employee: employeeMap.get(record.empregado_id)
    }));
  }

  async createTimeRecord(insertRecord: InsertTimeRecord): Promise<TimeRecord> {
    const result = await this.db.insert(timeRecords).values(insertRecord).returning();
    return result[0];
  }

  async updateTimeRecord(id: number, updates: Partial<TimeRecord>): Promise<void> {
    await this.db.update(timeRecords).set(updates).where(eq(timeRecords.id, id));
  }
}

// Classe de armazenamento em memória (para backup e desenvolvimento)
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private workSchedulesData: Map<number, WorkSchedule>;
  private timeRecordsData: Map<number, TimeRecord>;
  private userIdCounter: number;
  private scheduleIdCounter: number;
  private recordIdCounter: number;

  constructor() {
    this.usersData = new Map();
    this.workSchedulesData = new Map();
    this.timeRecordsData = new Map();
    this.userIdCounter = 1;
    this.scheduleIdCounter = 1;
    this.recordIdCounter = 1;
  }

  async initializeDb(): Promise<void> {
    // Verifica se já existe um usuário administrador
    const adminUser = await this.getAdminUser();
    if (!adminUser) {
      // Cria um usuário administrador padrão
      const adminData: InsertUser = {
        nome: "Administrador",
        cpf: "00000000000",
        senha: "$2b$10$Xt5/dSc6xBHa/r9b0h/3ieflh/XKaJR9kkQSCMAGnB36YMDyZBnrO", // senha123
        tipo: "admin",
        email: "admin@example.com",
        ativo: true,
        primeiro_acesso: false
      };
      
      await this.createUser(adminData);
      console.log("Usuário administrador padrão criado");
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByCPF(cpf: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.cpf === cpf,
    );
  }

  async getAdminUser(): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.tipo === "admin",
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      created_at: now 
    };
    this.usersData.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    const user = this.usersData.get(id);
    if (user) {
      this.usersData.set(id, { ...user, ...updates });
    }
  }

  async getAllEmployees(): Promise<User[]> {
    return Array.from(this.usersData.values()).filter(
      (user) => user.tipo === "empregado",
    );
  }

  // Work schedule operations
  async getEmployeeWorkSchedules(employeeId: number): Promise<WorkSchedule[]> {
    return Array.from(this.workSchedulesData.values()).filter(
      (schedule) => schedule.empregado_id === employeeId,
    );
  }

  async createWorkSchedule(insertSchedule: InsertWorkSchedule): Promise<WorkSchedule> {
    const id = this.scheduleIdCounter++;
    const schedule: WorkSchedule = { ...insertSchedule, id };
    this.workSchedulesData.set(id, schedule);
    return schedule;
  }

  async deleteEmployeeWorkSchedules(employeeId: number): Promise<void> {
    for (const [id, schedule] of this.workSchedulesData.entries()) {
      if (schedule.empregado_id === employeeId) {
        this.workSchedulesData.delete(id);
      }
    }
  }

  // Time record operations
  async getTimeRecord(id: number): Promise<TimeRecord | undefined> {
    const record = this.timeRecordsData.get(id);
    if (record) {
      // Add employee to record for display
      const employee = this.usersData.get(record.empregado_id);
      return {
        ...record,
        employee
      };
    }
    return undefined;
  }

  async getTimeRecordsByDate(date: Date): Promise<TimeRecord[]> {
    const dateString = date.toISOString().split('T')[0];
    const records = Array.from(this.timeRecordsData.values()).filter(
      (record) => {
        const recordDate = new Date(record.data);
        return recordDate.toISOString().split('T')[0] === dateString;
      }
    );
    
    // Add employee to each record
    return records.map(record => {
      const employee = this.usersData.get(record.empregado_id);
      return {
        ...record,
        employee
      };
    });
  }

  async getEmployeeTimeRecords(employeeId: number): Promise<TimeRecord[]> {
    return Array.from(this.timeRecordsData.values())
      .filter((record) => record.empregado_id === employeeId)
      .sort((a, b) => {
        // Sort by date in descending order
        const dateA = new Date(a.data);
        const dateB = new Date(b.data);
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getEmployeeTimeRecordByDate(employeeId: number, date: Date): Promise<TimeRecord | undefined> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.timeRecordsData.values()).find(
      (record) => {
        const recordDate = new Date(record.data);
        return record.empregado_id === employeeId && 
               recordDate.toISOString().split('T')[0] === dateString;
      }
    );
  }

  async getAllTimeRecords(): Promise<TimeRecord[]> {
    const records = Array.from(this.timeRecordsData.values())
      .sort((a, b) => {
        // Sort by date in descending order
        const dateA = new Date(a.data);
        const dateB = new Date(b.data);
        return dateB.getTime() - dateA.getTime();
      });
    
    // Add employee to each record
    return records.map(record => {
      const employee = this.usersData.get(record.empregado_id);
      return {
        ...record,
        employee
      };
    });
  }

  async getRecentTimeRecords(limit: number): Promise<TimeRecord[]> {
    const records = Array.from(this.timeRecordsData.values())
      .sort((a, b) => {
        // Sort by most recent activity
        const timeA = a.hora_saida || a.hora_retorno || a.hora_intervalo || a.hora_entrada || a.created_at;
        const timeB = b.hora_saida || b.hora_retorno || b.hora_intervalo || b.hora_entrada || b.created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      })
      .slice(0, limit);
    
    // Add employee to each record
    return records.map(record => {
      const employee = this.usersData.get(record.empregado_id);
      return {
        ...record,
        employee
      };
    });
  }

  async createTimeRecord(insertRecord: InsertTimeRecord): Promise<TimeRecord> {
    const id = this.recordIdCounter++;
    const now = new Date();
    const record: TimeRecord = { 
      ...insertRecord, 
      id,
      created_at: now 
    };
    this.timeRecordsData.set(id, record);
    return record;
  }

  async updateTimeRecord(id: number, updates: Partial<TimeRecord>): Promise<void> {
    const record = this.timeRecordsData.get(id);
    if (record) {
      this.timeRecordsData.set(id, { ...record, ...updates });
    }
  }
}

// Criamos uma instância da classe PostgresStorage
export const storage = new PostgresStorage();
