export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type LogContext = Record<string, unknown>;

export interface AppLogger {
  child(bindings: LogContext): AppLogger;
  trace(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  fatal(message: string, context?: LogContext): void;
}
