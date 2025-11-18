/**
 * Logger Utility
 * Centralized logging with different log levels
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    
    return `${prefix} ${message}`;
  }

  info(message: string, data?: unknown): void {
    console.log(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      console.error(this.formatMessage('error', message, {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      }));
    } else {
      console.error(this.formatMessage('error', message, error));
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
}

export const logger = new Logger();

