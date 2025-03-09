export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const handleError = (error: unknown): string => {
  if (error instanceof AuthError) {
    return error.message;
  }
  if (error instanceof ValidationError) {
    return error.message;
  }
  if (error instanceof Error) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
};