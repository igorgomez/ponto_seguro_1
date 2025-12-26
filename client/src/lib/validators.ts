import { z } from "zod";
import { validateCPF } from "./utils";

// CPF validator
export const cpfValidator = z.string()
  .min(11, "CPF deve ter 11 dígitos")
  .refine((cpf) => {
    // Remove non-numeric characters for validation
    const numericCPF = cpf.replace(/\D/g, '');
    return validateCPF(numericCPF);
  }, {
    message: "CPF inválido"
  });

// Extended login schema with CPF validation
export const extendedLoginSchema = z.object({
  cpf: cpfValidator,
  senha: z.string().min(1, "Senha é obrigatória"),
});

// Extended add employee schema with CPF validation
export const extendedAddEmployeeSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: cpfValidator,
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  tipo_contrato: z.string().min(1, "Tipo de contrato é obrigatório"),
  carga_horaria: z.number().min(1, "Carga horária é obrigatória")
});

// Time registration validation schema
export const timeRegistrationSchema = z.object({
  type: z.enum(['entry', 'break', 'return', 'exit']),
  timestamp: z.date().optional().default(() => new Date())
});

// Extended password change schema
export const extendedChangePasswordSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
  novaSenha: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  confirmaSenha: z.string().min(1, "Confirmação de senha é obrigatória")
}).refine(data => data.novaSenha === data.confirmaSenha, {
  message: "As senhas não coincidem",
  path: ["confirmaSenha"]
});

// Validate work schedule entry
export const workScheduleEntryValidator = z.object({
  dia_semana: z.string(),
  ativo: z.boolean(),
  hora_entrada: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  hora_saida: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  intervalo_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido"),
  intervalo_fim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido")
});

// Validate complete work schedule
export const workScheduleValidator = z.object({
  empregado_id: z.number(),
  schedules: z.array(workScheduleEntryValidator)
});
