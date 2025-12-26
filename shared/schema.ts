import { pgTable, text, serial, timestamp, boolean, date, time, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table: stores both admins and employees
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  cpf: text("cpf").notNull().unique(),
  nome: text("nome").notNull(),
  senha: text("senha").notNull(),
  tipo: text("tipo").notNull().default("empregado"), // 'admin' or 'empregado'
  ativo: boolean("ativo").notNull().default(true),
  email: text("email"),
  telefone: text("telefone"),
  data_nascimento: date("data_nascimento"),
  data_inicio: date("data_inicio"),
  carga_horaria: integer("carga_horaria"),
  tipo_contrato: text("tipo_contrato"),
  primeiro_acesso: boolean("primeiro_acesso").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Work schedules table: stores work schedules for employees
export const workSchedules = pgTable("work_schedules", {
  id: serial("id").primaryKey(),
  empregado_id: integer("empregado_id").notNull().references(() => users.id),
  dia_semana: text("dia_semana").notNull(), // 'segunda', 'terca', etc.
  hora_inicio: time("hora_inicio").notNull(),
  hora_fim: time("hora_fim").notNull(),
  intervalo_inicio: time("intervalo_inicio"),
  intervalo_fim: time("intervalo_fim"),
});

// Time records table: stores clock in/out records
export const timeRecords = pgTable("time_records", {
  id: serial("id").primaryKey(),
  empregado_id: integer("empregado_id").notNull().references(() => users.id),
  data: date("data").notNull(),
  hora_entrada: timestamp("hora_entrada"),
  hora_intervalo: timestamp("hora_intervalo"),
  hora_retorno: timestamp("hora_retorno"),
  hora_saida: timestamp("hora_saida"),
  observacao: text("observacao"),
  localizacao_entrada: jsonb("localizacao_entrada"),
  localizacao_intervalo: jsonb("localizacao_intervalo"),
  localizacao_retorno: jsonb("localizacao_retorno"),
  localizacao_saida: jsonb("localizacao_saida"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
}).partial({
  senha: true,
  tipo: true,
  ativo: true,
  primeiro_acesso: true
});

export const insertWorkScheduleSchema = createInsertSchema(workSchedules).omit({
  id: true,
});

export const insertTimeRecordSchema = createInsertSchema(timeRecords).omit({
  id: true,
  created_at: true,
});

// Login schema
export const loginSchema = z.object({
  cpf: z.string().min(1, "CPF é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

// Admin key validation schema
export const adminKeySchema = z.object({
  adminKey: z.string().refine(val => val === "admin123ponto", {
    message: "Chave de acesso inválida"
  })
});

// Password change schema
export const changePasswordSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
  novaSenha: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  confirmaSenha: z.string().min(1, "Confirmação de senha é obrigatória")
}).refine(data => data.novaSenha === data.confirmaSenha, {
  message: "As senhas não coincidem",
  path: ["confirmaSenha"]
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type WorkSchedule = typeof workSchedules.$inferSelect;
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;
export type TimeRecord = typeof timeRecords.$inferSelect & { 
  employee?: User
};
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type AdminKey = z.infer<typeof adminKeySchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
