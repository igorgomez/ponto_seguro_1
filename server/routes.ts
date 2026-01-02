import { Router, type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, adminMiddleware } from "./auth";
import { firebaseAuthMiddleware } from "./firebaseAuth";
import { 
  loginSchema, 
  adminKeySchema, 
  changePasswordSchema,
  insertUserSchema,
  insertWorkScheduleSchema,
  insertTimeRecordSchema,
  timeRecords,
  users
} from "../shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = Router();
  
  // Auth routes
  const authRouter = Router();
  
  // Login
  authRouter.post("/login", async (req: Request, res: Response) => {
    try {
      const { cpf, senha } = loginSchema.parse(req.body);
      
      // Find user by CPF
      const user = await storage.getUserByCPF(cpf);
      
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Check if user is active
      if (!user.ativo) {
        return res.status(401).json({ message: "Usuário inativo" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(senha, user.senha);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Set user in session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Return user without password
      const { senha: _, ...userWithoutPassword } = user;
      
      return res.status(200).json({ 
        message: "Login realizado com sucesso",
        user: userWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      console.error("Login error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Logout
  authRouter.post("/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer logout" });
        }
        
        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Logout realizado com sucesso" });
      });
    } else {
      return res.status(200).json({ message: "Logout realizado com sucesso" });
    }
  });

  // Firebase Login (NEW - Fase 1)
  authRouter.post("/firebase-login", firebaseAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const firebaseUid = (req as any).firebaseUid;
      const { email } = req.body;

      if (!firebaseUid || !email) {
        return res.status(400).json({ message: "Firebase UID e email são obrigatórios" });
      }

      // Procura usuário existente por firebase_uid (quando migration for feita)
      let user = await storage.getUserByFirebaseUid?.(firebaseUid);

      if (!user) {
        // Procura por email como fallback
        user = await storage.getUserByEmail?.(email);

        if (!user) {
          // Cria usuário novo
          const hashedPassword = await bcrypt.hash("firebase-auth", 10);
          user = await storage.createUser({
            nome: "Novo Usuário",
            cpf: `firebase-${firebaseUid.substring(0, 11)}`, // Temporário
            email: email || "",
            senha: hashedPassword,
            tipo: "empregado",
            ativo: true,
            primeiro_acesso: true,
          });
        }
      }

      // Verifica se usuário está ativo
      if (!user.ativo) {
        return res.status(401).json({ message: "Usuário inativo" });
      }

      // Retorna usuário sem senha
      const { senha: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        message: "Login realizado com sucesso",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Firebase login error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Validate Admin Key
  authRouter.post("/validate-admin-key", (req: Request, res: Response) => {
    try {
      const { adminKey } = adminKeySchema.parse(req.body);
      
      // Key is already validated by Zod schema
      return res.status(200).json({ valid: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          valid: false,
          message: error.errors[0].message 
        });
      }
      
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Setup Account (First access)
  authRouter.post("/setup-account", async (req: Request, res: Response) => {
    try {
      const { cpf, novaSenha } = req.body;
      
      if (!cpf || !novaSenha) {
        return res.status(400).json({ message: "CPF e nova senha são obrigatórios" });
      }
      
      // Check if user exists for admin setup or if user is logged in for employee setup
      let user;
      
      if (req.session?.userId) {
        // Employee changing password on first access
        user = await storage.getUser(req.session.userId);
        
        if (!user) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
        
        if (!user.primeiro_acesso) {
          return res.status(400).json({ message: "Não é o primeiro acesso do usuário" });
        }
      } else {
        // Admin setup
        // Check if there's already an admin
        const existingAdmin = await storage.getAdminUser();
        
        if (existingAdmin) {
          return res.status(400).json({ message: "Já existe um administrador configurado" });
        }
        
        // Check if CPF is already in use
        const existingUser = await storage.getUserByCPF(cpf);
        
        if (existingUser) {
          return res.status(400).json({ message: "CPF já está em uso" });
        }
        
        // Create admin user
        const hashedPassword = await bcrypt.hash(novaSenha, 10);
        
        user = await storage.createUser({
          cpf,
          nome: "Administrador",
          senha: hashedPassword,
          tipo: "admin",
          ativo: true,
          primeiro_acesso: false
        });
        
        // Set user in session
        if (req.session) {
          req.session.userId = user.id;
        }
      }
      
      // If employee setup, update password and first access flag
      if (req.session?.userId && user.id === req.session.userId) {
        const hashedPassword = await bcrypt.hash(novaSenha, 10);
        
        await storage.updateUser(user.id, {
          senha: hashedPassword,
          primeiro_acesso: false
        });
      }
      
      return res.status(200).json({ 
        message: "Conta configurada com sucesso",
        userId: user.id
      });
    } catch (error) {
      console.error("Setup account error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Change Password
  authRouter.post("/change-password", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { senhaAtual, novaSenha } = changePasswordSchema.parse(req.body);
      
      // Get user from session
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(senhaAtual, user.senha);
      
      if (!isValidPassword) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      // Update password
      const hashedPassword = await bcrypt.hash(novaSenha, 10);
      
      await storage.updateUser(user.id, {
        senha: hashedPassword
      });
      
      return res.status(200).json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      console.error("Change password error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Get current user
  authRouter.get("/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Return user without password
      const { senha, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  apiRouter.use("/auth", authRouter);
  
  // Employees routes
  const employeesRouter = Router();
  
  // Get all employees (admin only)
  employeesRouter.get("/", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const employees = await storage.getAllEmployees();
      
      // Remove passwords
      const employeesWithoutPasswords = employees.map(emp => {
        const { senha, ...empWithoutPassword } = emp;
        return empWithoutPassword;
      });
      
      return res.status(200).json(employeesWithoutPasswords);
    } catch (error) {
      console.error("Get employees error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Get current employee (for employee dashboard)
  employeesRouter.get("/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      if (user.tipo !== "empregado") {
        return res.status(403).json({ message: "Acesso não autorizado" });
      }
      
      // Return user without password
      const { senha, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get employee error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Create employee (admin only)
  employeesRouter.post("/", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const employeeData = insertUserSchema.parse(req.body);
      
      // Check if CPF is already in use
      const existingUser = await storage.getUserByCPF(employeeData.cpf);
      
      if (existingUser) {
        return res.status(400).json({ message: "CPF já está em uso" });
      }
      
      // Hash password (initial password is CPF + "ponto")
      const initialPassword = `${employeeData.cpf}ponto`;
      const hashedPassword = await bcrypt.hash(initialPassword, 10);
      
      // Create employee
      const employee = await storage.createUser({
        ...employeeData,
        senha: hashedPassword,
        tipo: "empregado",
        ativo: true,
        primeiro_acesso: true
      });
      
      // Return employee without password
      const { senha, ...employeeWithoutPassword } = employee;
      
      return res.status(201).json({ 
        message: "Empregado criado com sucesso",
        employee: employeeWithoutPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      console.error("Create employee error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Toggle employee status (admin only)
  employeesRouter.patch("/:id/toggle-status", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: "ID de empregado inválido" });
      }
      
      const employee = await storage.getUser(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Empregado não encontrado" });
      }
      
      if (employee.tipo !== "empregado") {
        return res.status(400).json({ message: "Usuário não é um empregado" });
      }
      
      // Toggle status
      await storage.updateUser(employeeId, {
        ativo: !employee.ativo
      });
      
      return res.status(200).json({ 
        message: `Empregado ${employee.ativo ? 'inativado' : 'ativado'} com sucesso`,
        ativo: !employee.ativo
      });
    } catch (error) {
      console.error("Toggle employee status error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Reset employee password (admin only)
  employeesRouter.post("/:id/reset-password", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: "ID de empregado inválido" });
      }
      
      const employee = await storage.getUser(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Empregado não encontrado" });
      }
      
      if (employee.tipo !== "empregado") {
        return res.status(400).json({ message: "Usuário não é um empregado" });
      }
      
      // Reset password to CPF + "ponto" and set primeiro_acesso to true
      const resetPassword = `${employee.cpf}ponto`;
      const hashedPassword = await bcrypt.hash(resetPassword, 10);
      
      await storage.updateUser(employeeId, {
        senha: hashedPassword,
        primeiro_acesso: true
      });
      
      return res.status(200).json({ 
        message: "Senha do empregado redefinida com sucesso"
      });
    } catch (error) {
      console.error("Reset employee password error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  apiRouter.use("/employees", employeesRouter);
  
  // Work Schedule routes
  const workScheduleRouter = Router();
  
  // Get work schedule for an employee (admin view)
  workScheduleRouter.get("/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ message: "ID de empregado inválido" });
      }
      
      const schedules = await storage.getEmployeeWorkSchedules(employeeId);
      
      return res.status(200).json(schedules);
    } catch (error) {
      console.error("Get work schedule error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Get work schedule for current employee
  workScheduleRouter.get("/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const schedules = await storage.getEmployeeWorkSchedules(req.session.userId);
      
      return res.status(200).json(schedules);
    } catch (error) {
      console.error("Get employee work schedule error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Save work schedule (admin only)
  workScheduleRouter.post("/", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { schedules } = req.body;
      
      if (!schedules || !Array.isArray(schedules)) {
        return res.status(400).json({ message: "Dados de horário inválidos" });
      }

      // Se todas as escalas são para o mesmo empregado, limpar as escalas existentes
      const empregadoIds = [...new Set(schedules.map(s => s.empregado_id))];
      
      if (empregadoIds.length === 1) {
        const empregado_id = empregadoIds[0];
        
        // Validate employee exists
        const employee = await storage.getUser(empregado_id);
        
        if (!employee) {
          return res.status(404).json({ message: "Empregado não encontrado" });
        }
        
        // Delete existing schedules for this employee
        await storage.deleteEmployeeWorkSchedules(empregado_id);
      }
      
      // Create new schedules
      const createdSchedules = await Promise.all(
        schedules.map(schedule => {
          // Validar o objeto da escala
          const validSchedule = insertWorkScheduleSchema.parse(schedule);
          
          // Criar a escala
          return storage.createWorkSchedule(validSchedule);
        })
      );
      
      return res.status(201).json({
        message: "Horários salvos com sucesso",
        schedules: createdSchedules
      });
    } catch (error) {
      console.error("Save work schedule error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  apiRouter.use("/work-schedule", workScheduleRouter);
  
  // Time Records routes
  const timeRecordsRouter = Router();
  
  // Get all time records (admin only)
  timeRecordsRouter.get("/", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const timeRecords = await storage.getAllTimeRecords();
      
      return res.status(200).json(timeRecords);
    } catch (error) {
      console.error("Get time records error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Get today's time records (admin only)
  timeRecordsRouter.get("/today", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const timeRecords = await storage.getTimeRecordsByDate(today);
      
      return res.status(200).json(timeRecords);
    } catch (error) {
      console.error("Get today's time records error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Get time records for current employee
  timeRecordsRouter.get("/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const timeRecords = await storage.getEmployeeTimeRecords(req.session.userId);
      
      return res.status(200).json(timeRecords);
    } catch (error) {
      console.error("Get employee time records error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Get today's time record for current employee
  timeRecordsRouter.get("/today/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const timeRecord = await storage.getEmployeeTimeRecordByDate(req.session.userId, today);
      
      return res.status(200).json(timeRecord || null);
    } catch (error) {
      console.error("Get today's employee time record error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Register time (for employee)
  timeRecordsRouter.post("/register", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const { type } = req.body;
      
      if (!type || !['entry', 'break', 'return', 'exit'].includes(type)) {
        return res.status(400).json({ message: "Tipo de registro inválido" });
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const formattedDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Get or create today's record
      let timeRecord = await storage.getEmployeeTimeRecordByDate(req.session.userId, today);
      
      if (!timeRecord) {
        timeRecord = await storage.createTimeRecord({
          empregado_id: req.session.userId,
          data: formattedDate
        });
      }
      
      // Update the appropriate field based on type
      const updateData: Partial<typeof timeRecords.$inferSelect> = {};
      
      // Registro de ponto sem restrições de horário para refletir a realidade
      // Os dados serão comparados com a escala de trabalho para relatórios
      switch (type) {
        case 'entry':
          // Permitir registrar entrada mesmo que já esteja registrada (sobreescreve a anterior)
          updateData.hora_entrada = now;
          break;
        case 'break':
          // Permitir registrar intervalo se houver pelo menos uma entrada registrada
          if (!timeRecord.hora_entrada) {
            return res.status(400).json({ message: "Entrada não registrada" });
          }
          updateData.hora_intervalo = now;
          break;
        case 'return':
          // Permitir registrar retorno se houver pelo menos um intervalo registrado
          if (!timeRecord.hora_intervalo) {
            return res.status(400).json({ message: "Intervalo não registrado" });
          }
          updateData.hora_retorno = now;
          break;
        case 'exit':
          // Garantir que pelo menos a entrada foi registrada
          if (!timeRecord.hora_entrada) {
            return res.status(400).json({ message: "Entrada não registrada" });
          }
          
          // Se houve intervalo, deve haver retorno antes da saída
          if (timeRecord.hora_intervalo && !timeRecord.hora_retorno) {
            return res.status(400).json({ message: "Retorno do intervalo não registrado" });
          }
          
          updateData.hora_saida = now;
          break;
      }
      
      // Update record
      await storage.updateTimeRecord(timeRecord.id, updateData);
      
      // Get updated record
      const updatedRecord = await storage.getTimeRecord(timeRecord.id);
      
      return res.status(200).json({
        message: "Registro realizado com sucesso",
        record: updatedRecord
      });
    } catch (error) {
      console.error("Register time error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // Edit time record (admin only)
  timeRecordsRouter.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
    try {
      const recordId = parseInt(req.params.id);
      
      if (isNaN(recordId)) {
        return res.status(400).json({ message: "ID de registro inválido" });
      }
      
      const { hora_entrada, hora_intervalo, hora_retorno, hora_saida, motivo_edicao } = req.body;
      
      if (!motivo_edicao) {
        return res.status(400).json({ message: "Motivo da edição é obrigatório" });
      }
      
      // Get record
      const record = await storage.getTimeRecord(recordId);
      
      if (!record) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }
      
      // Prepare update data
      const updateData: Partial<typeof timeRecords.$inferSelect> = {
        motivo_edicao,
        editado_por: req.session?.userId
      };
      
      // Convert time strings to Date objects if provided
      if (hora_entrada) {
        const [hours, minutes] = hora_entrada.split(':').map(Number);
        const date = new Date(record.data);
        date.setHours(hours, minutes, 0, 0);
        updateData.hora_entrada = date;
      }
      
      if (hora_intervalo) {
        const [hours, minutes] = hora_intervalo.split(':').map(Number);
        const date = new Date(record.data);
        date.setHours(hours, minutes, 0, 0);
        updateData.hora_intervalo = date;
      }
      
      if (hora_retorno) {
        const [hours, minutes] = hora_retorno.split(':').map(Number);
        const date = new Date(record.data);
        date.setHours(hours, minutes, 0, 0);
        updateData.hora_retorno = date;
      }
      
      if (hora_saida) {
        const [hours, minutes] = hora_saida.split(':').map(Number);
        const date = new Date(record.data);
        date.setHours(hours, minutes, 0, 0);
        updateData.hora_saida = date;
      }
      
      // Update record
      await storage.updateTimeRecord(recordId, updateData);
      
      // Get updated record
      const updatedRecord = await storage.getTimeRecord(recordId);
      
      return res.status(200).json({
        message: "Registro atualizado com sucesso",
        record: updatedRecord
      });
    } catch (error) {
      console.error("Edit time record error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  apiRouter.use("/time-records", timeRecordsRouter);
  
  // Activities routes (for admin dashboard)
  const activitiesRouter = Router();
  
  // Get recent activities
  activitiesRouter.get("/recent", adminMiddleware, async (req: Request, res: Response) => {
    try {
      // Get most recent time records
      const recentRecords = await storage.getRecentTimeRecords(5);
      
      // Transform into activities
      const activities = recentRecords.map(record => {
        let description = "";
        let time = "";
        
        if (record.hora_saida) {
          description = `${record.employee?.nome || 'Empregado'} registrou saída`;
          time = new Date(record.hora_saida).toLocaleString('pt-BR');
        } else if (record.hora_retorno) {
          description = `${record.employee?.nome || 'Empregado'} registrou retorno`;
          time = new Date(record.hora_retorno).toLocaleString('pt-BR');
        } else if (record.hora_intervalo) {
          description = `${record.employee?.nome || 'Empregado'} registrou intervalo`;
          time = new Date(record.hora_intervalo).toLocaleString('pt-BR');
        } else if (record.hora_entrada) {
          description = `${record.employee?.nome || 'Empregado'} registrou entrada`;
          time = new Date(record.hora_entrada).toLocaleString('pt-BR');
        }
        
        return {
          id: record.id,
          description,
          time,
          type: record.hora_saida ? 'exit' : record.hora_retorno ? 'return' : record.hora_intervalo ? 'break' : 'entry'
        };
      });
      
      return res.status(200).json(activities);
    } catch (error) {
      console.error("Get recent activities error:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  apiRouter.use("/activities", activitiesRouter);
  
  // Register API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
