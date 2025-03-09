type LogLevel = 'info' | 'warn' | 'error';

export const log = (message: string, level: LogLevel = 'info', data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  switch (level) {
    case 'warn':
      console.warn(logMessage, data);
      break;
    case 'error':
      console.error(logMessage, data);
      break;
    default:
      console.log(logMessage, data);
  }
};