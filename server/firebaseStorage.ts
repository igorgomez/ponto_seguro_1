import { getFirestore, Timestamp } from './firebaseAdmin';
import {
  User,
  InsertUser,
  WorkSchedule,
  InsertWorkSchedule,
  TimeRecord,
  InsertTimeRecord,
} from '@shared/schema';
import { IStorage } from './storage';

/**
 * Implementação de Storage com Firestore
 * Mantém compatibilidade com interface IStorage para transição suave
 */
export class FirestoreStorage implements IStorage {
  private db: ReturnType<typeof getFirestore>;

  constructor() {
    this.db = getFirestore();
  }

  /**
   * ===== USUARIO OPERATIONS =====
   */

  async getUser(id: number): Promise<User | undefined> {
    try {
      const doc = await this.db
        .collection('users')
        .where('id', '==', id)
        .limit(1)
        .get();

      if (doc.empty) return undefined;

      const data = doc.docs[0].data();
      return this.mapFirestoreDocToUser(data);
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  }

  async getUserByCPF(cpf: string): Promise<User | undefined> {
    try {
      const doc = await this.db
        .collection('users')
        .where('cpf', '==', cpf)
        .limit(1)
        .get();

      if (doc.empty) return undefined;

      const data = doc.docs[0].data();
      return this.mapFirestoreDocToUser(data);
    } catch (error) {
      console.error('Error getting user by CPF:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const doc = await this.db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (doc.empty) return undefined;

      const data = doc.docs[0].data();
      return this.mapFirestoreDocToUser(data);
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    try {
      const doc = await this.db
        .collection('users')
        .where('firebase_uid', '==', firebaseUid)
        .limit(1)
        .get();

      if (doc.empty) return undefined;

      const data = doc.docs[0].data();
      return this.mapFirestoreDocToUser(data);
    } catch (error) {
      console.error('Error getting user by Firebase UID:', error);
      throw error;
    }
  }

  async getAdminUser(): Promise<User | undefined> {
    try {
      const doc = await this.db
        .collection('users')
        .where('tipo', '==', 'admin')
        .limit(1)
        .get();

      if (doc.empty) return undefined;

      const data = doc.docs[0].data();
      return this.mapFirestoreDocToUser(data);
    } catch (error) {
      console.error('Error getting admin user:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Gera novo ID (simples counter - pode ser melhorado)
      const usersSnap = await this.db
        .collection('users')
        .orderBy('id', 'desc')
        .limit(1)
        .get();

      const nextId = usersSnap.empty ? 1 : usersSnap.docs[0].data().id + 1;

      const userData = {
        id: nextId,
        ...user,
        created_at: Timestamp.now(),
      };

      // Usar documento com ID customizado (por ID)
      await this.db.collection('users').doc(`user_${nextId}`).set(userData);

      return this.mapFirestoreDocToUser(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    try {
      // Procura o documento pelo ID
      const userDoc = await this.db
        .collection('users')
        .where('id', '==', id)
        .limit(1)
        .get();

      if (userDoc.empty) {
        throw new Error(`User with id ${id} not found`);
      }

      const docRef = userDoc.docs[0].ref;
      await docRef.update(updates);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async getAllEmployees(): Promise<User[]> {
    try {
      const docs = await this.db
        .collection('users')
        .where('tipo', '==', 'empregado')
        .get();

      return docs.docs.map((doc) => this.mapFirestoreDocToUser(doc.data()));
    } catch (error) {
      console.error('Error getting all employees:', error);
      throw error;
    }
  }

  /**
   * ===== WORK SCHEDULE OPERATIONS =====
   */

  async getEmployeeWorkSchedules(employeeId: number): Promise<WorkSchedule[]> {
    try {
      const docs = await this.db
        .collection('workSchedules')
        .where('empregado_id', '==', employeeId)
        .get();

      return docs.docs.map((doc) => this.mapFirestoreDocToWorkSchedule(doc.data()));
    } catch (error) {
      console.error('Error getting work schedules:', error);
      throw error;
    }
  }

  async createWorkSchedule(schedule: InsertWorkSchedule): Promise<WorkSchedule> {
    try {
      const scheduleSnap = await this.db
        .collection('workSchedules')
        .orderBy('id', 'desc')
        .limit(1)
        .get();

      const nextId = scheduleSnap.empty ? 1 : scheduleSnap.docs[0].data().id + 1;

      const scheduleData = {
        id: nextId,
        ...schedule,
      };

      await this.db
        .collection('workSchedules')
        .doc(`schedule_${nextId}`)
        .set(scheduleData);

      return this.mapFirestoreDocToWorkSchedule(scheduleData);
    } catch (error) {
      console.error('Error creating work schedule:', error);
      throw error;
    }
  }

  async deleteEmployeeWorkSchedules(employeeId: number): Promise<void> {
    try {
      const docs = await this.db
        .collection('workSchedules')
        .where('empregado_id', '==', employeeId)
        .get();

      const batch = this.db.batch();
      docs.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting work schedules:', error);
      throw error;
    }
  }

  /**
   * ===== TIME RECORD OPERATIONS =====
   */

  async getTimeRecord(id: number): Promise<TimeRecord | undefined> {
    try {
      const doc = await this.db
        .collection('timeRecords')
        .where('id', '==', id)
        .limit(1)
        .get();

      if (doc.empty) return undefined;

      const recordData = doc.docs[0].data();
      const employee = await this.getUser(recordData.empregado_id);

      return this.mapFirestoreDocToTimeRecord(recordData, employee);
    } catch (error) {
      console.error('Error getting time record:', error);
      throw error;
    }
  }

  async getTimeRecordsByDate(date: Date): Promise<TimeRecord[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];

      const docs = await this.db
        .collection('timeRecords')
        .where('data', '==', dateStr)
        .get();

      const records = docs.docs.map((doc) => doc.data());

      // Buscar empregados em paralelo
      const employees = await Promise.all(
        records.map((record) => this.getUser(record.empregado_id))
      );

      return records.map((record, idx) =>
        this.mapFirestoreDocToTimeRecord(record, employees[idx])
      );
    } catch (error) {
      console.error('Error getting time records by date:', error);
      throw error;
    }
  }

  async getEmployeeTimeRecords(employeeId: number): Promise<TimeRecord[]> {
    try {
      const docs = await this.db
        .collection('timeRecords')
        .where('empregado_id', '==', employeeId)
        .orderBy('data', 'desc')
        .get();

      const employee = await this.getUser(employeeId);

      return docs.docs.map((doc) =>
        this.mapFirestoreDocToTimeRecord(doc.data(), employee)
      );
    } catch (error) {
      console.error('Error getting employee time records:', error);
      throw error;
    }
  }

  async getEmployeeTimeRecordByDate(
    employeeId: number,
    date: Date
  ): Promise<TimeRecord | undefined> {
    try {
      const dateStr = date.toISOString().split('T')[0];

      const doc = await this.db
        .collection('timeRecords')
        .where('empregado_id', '==', employeeId)
        .where('data', '==', dateStr)
        .limit(1)
        .get();

      if (doc.empty) return undefined;

      const recordData = doc.docs[0].data();
      const employee = await this.getUser(employeeId);

      return this.mapFirestoreDocToTimeRecord(recordData, employee);
    } catch (error) {
      console.error('Error getting employee time record by date:', error);
      throw error;
    }
  }

  async getAllTimeRecords(): Promise<TimeRecord[]> {
    try {
      const docs = await this.db
        .collection('timeRecords')
        .orderBy('data', 'desc')
        .get();

      const records = docs.docs.map((doc) => doc.data());

      // Buscar empregados em paralelo
      const employeeIds = [...new Set(records.map((r) => r.empregado_id))];
      const employees = await Promise.all(
        employeeIds.map((id) => this.getUser(id))
      );
      const employeeMap = new Map(employees.map((e) => [e?.id, e]));

      return records.map((record) =>
        this.mapFirestoreDocToTimeRecord(record, employeeMap.get(record.empregado_id))
      );
    } catch (error) {
      console.error('Error getting all time records:', error);
      throw error;
    }
  }

  async getRecentTimeRecords(limit: number): Promise<TimeRecord[]> {
    try {
      const docs = await this.db
        .collection('timeRecords')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();

      const records = docs.docs.map((doc) => doc.data());

      // Buscar empregados em paralelo
      const employees = await Promise.all(
        records.map((record) => this.getUser(record.empregado_id))
      );

      return records.map((record, idx) =>
        this.mapFirestoreDocToTimeRecord(record, employees[idx])
      );
    } catch (error) {
      console.error('Error getting recent time records:', error);
      throw error;
    }
  }

  async createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord> {
    try {
      const recordSnap = await this.db
        .collection('timeRecords')
        .orderBy('id', 'desc')
        .limit(1)
        .get();

      const nextId = recordSnap.empty ? 1 : recordSnap.docs[0].data().id + 1;

      const recordData = {
        id: nextId,
        ...record,
        created_at: Timestamp.now(),
      };

      await this.db
        .collection('timeRecords')
        .doc(`record_${nextId}`)
        .set(recordData);

      const employee = await this.getUser(record.empregado_id);
      return this.mapFirestoreDocToTimeRecord(recordData, employee);
    } catch (error) {
      console.error('Error creating time record:', error);
      throw error;
    }
  }

  async updateTimeRecord(id: number, updates: Partial<TimeRecord>): Promise<void> {
    try {
      const doc = await this.db
        .collection('timeRecords')
        .where('id', '==', id)
        .limit(1)
        .get();

      if (doc.empty) {
        throw new Error(`TimeRecord with id ${id} not found`);
      }

      const docRef = doc.docs[0].ref;
      await docRef.update(updates);
    } catch (error) {
      console.error('Error updating time record:', error);
      throw error;
    }
  }

  /**
   * ===== INITIALIZATION =====
   */

  async initializeDb(): Promise<void> {
    try {
      // Verificar se já existe um admin
      const admin = await this.getAdminUser();

      if (!admin) {
        // Criar admin padrão
        const hashedPassword = '$2b$10$Xt5/dSc6xBHa/r9b0h/3ieflh/XKaJR9kkQSCMAGnB36YMDyZBnrO'; // senha123

        await this.createUser({
          nome: 'Administrador',
          cpf: '00000000000',
          senha: hashedPassword,
          tipo: 'admin',
          email: 'admin@example.com',
          ativo: true,
          primeiro_acesso: false,
        });

        console.log('Default admin user created in Firestore');
      }

      console.log('Firestore database initialized successfully');
    } catch (error) {
      console.error('Error initializing Firestore database:', error);
      throw error;
    }
  }

  /**
   * ===== HELPER METHODS =====
   */

  private mapFirestoreDocToUser(data: any): User {
    return {
      id: data.id,
      cpf: data.cpf,
      nome: data.nome,
      senha: data.senha,
      tipo: data.tipo,
      ativo: data.ativo,
      email: data.email || null,
      telefone: data.telefone || null,
      primeiro_acesso: data.primeiro_acesso,
      created_at: data.created_at instanceof Timestamp 
        ? data.created_at.toDate() 
        : new Date(data.created_at),
      data_nascimento: data.data_nascimento || null,
      data_inicio: data.data_inicio || null,
      carga_horaria: data.carga_horaria || null,
      tipo_contrato: data.tipo_contrato || null,
    };
  }

  private mapFirestoreDocToWorkSchedule(data: any): WorkSchedule {
    return {
      id: data.id,
      empregado_id: data.empregado_id,
      dia_semana: data.dia_semana,
      hora_inicio: data.hora_inicio,
      hora_fim: data.hora_fim,
      intervalo_inicio: data.intervalo_inicio || null,
      intervalo_fim: data.intervalo_fim || null,
    };
  }

  private mapFirestoreDocToTimeRecord(data: any, employee?: User): TimeRecord {
    return {
      id: data.id,
      empregado_id: data.empregado_id,
      data: data.data,
      hora_entrada: data.hora_entrada 
        ? (data.hora_entrada instanceof Timestamp 
          ? data.hora_entrada.toDate() 
          : new Date(data.hora_entrada))
        : null,
      hora_intervalo: data.hora_intervalo 
        ? (data.hora_intervalo instanceof Timestamp 
          ? data.hora_intervalo.toDate() 
          : new Date(data.hora_intervalo))
        : null,
      hora_retorno: data.hora_retorno 
        ? (data.hora_retorno instanceof Timestamp 
          ? data.hora_retorno.toDate() 
          : new Date(data.hora_retorno))
        : null,
      hora_saida: data.hora_saida 
        ? (data.hora_saida instanceof Timestamp 
          ? data.hora_saida.toDate() 
          : new Date(data.hora_saida))
        : null,
      observacao: data.observacao || null,
      localizacao_entrada: data.localizacao_entrada || null,
      localizacao_intervalo: data.localizacao_intervalo || null,
      localizacao_retorno: data.localizacao_retorno || null,
      localizacao_saida: data.localizacao_saida || null,
      created_at: data.created_at instanceof Timestamp 
        ? data.created_at.toDate() 
        : new Date(data.created_at),
      employee,
    };
  }
}

export default FirestoreStorage;
