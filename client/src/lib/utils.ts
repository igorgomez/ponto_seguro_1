import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCPF(value: string): string {
  // Remove tudo que não for número
  const cpfNumbers = value.replace(/\D/g, "");
  
  // Limita a 11 dígitos (CPF)
  const limitedValue = cpfNumbers.slice(0, 11);
  
  // Formata conforme a máscara xxx.xxx.xxx-xx
  let formattedValue = limitedValue;
  
  if (limitedValue.length > 3) {
    formattedValue = limitedValue.replace(/^(\d{3})/, "$1.");
  }
  
  if (limitedValue.length > 6) {
    formattedValue = formattedValue.replace(/^(\d{3})\.(\d{3})/, "$1.$2.");
  }
  
  if (limitedValue.length > 9) {
    formattedValue = formattedValue.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, "$1.$2.$3-");
  }
  
  return formattedValue;
}

export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Valida os dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

export function bcryptHash(password: string): string {
  // This is a placeholder implementation - in a real app, bcrypt would be used on the server
  // and never in the client. This is just for demo/mock purposes.
  return `hashed:${password}`;
}

export function calculateHoursWorked(startTime: Date, endTime: Date, breakStart?: Date, breakEnd?: Date): string {
  let totalMilliseconds = endTime.getTime() - startTime.getTime();
  
  // Subtract break time if available
  if (breakStart && breakEnd) {
    const breakDuration = breakEnd.getTime() - breakStart.getTime();
    totalMilliseconds -= breakDuration;
  }
  
  // Convert to hours and minutes
  const hours = Math.floor(totalMilliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

export function formatTimeFromDate(date: Date | string | null): string {
  if (!date) return '--:--';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
}

export function formatDateToLocaleDateString(date: Date | string | null): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
}
