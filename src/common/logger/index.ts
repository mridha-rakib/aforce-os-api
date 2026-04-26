import pino, { type Logger as PinoLogger, type LoggerOptions as PinoLoggerOptions } from 'pino';
import { createLogger as createWinstonLogger, format, transports, addColors } from 'winston';

import { env } from '../../config/env';
import type { AppLogger, LogContext, LogLevel } from './logger.types';

const winstonLevels: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

addColors({
  fatal: 'magenta',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  trace: 'gray',
});

function serializeError(error: Error): Record<string, unknown> {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

function normalizeContext(context?: LogContext): LogContext | undefined {
  if (!context) {
    return undefined;
  }

  const normalized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    normalized[key] = value instanceof Error ? serializeError(value) : value;
  }

  return normalized;
}

class PinoAdapter implements AppLogger {
  public constructor(private readonly instance: PinoLogger) {}

  public child(bindings: LogContext): AppLogger {
    return new PinoAdapter(this.instance.child(bindings));
  }

  public trace(message: string, context?: LogContext): void {
    this.instance.trace(normalizeContext(context), message);
  }

  public debug(message: string, context?: LogContext): void {
    this.instance.debug(normalizeContext(context), message);
  }

  public info(message: string, context?: LogContext): void {
    this.instance.info(normalizeContext(context), message);
  }

  public warn(message: string, context?: LogContext): void {
    this.instance.warn(normalizeContext(context), message);
  }

  public error(message: string, context?: LogContext): void {
    this.instance.error(normalizeContext(context), message);
  }

  public fatal(message: string, context?: LogContext): void {
    this.instance.fatal(normalizeContext(context), message);
  }
}

type WinstonInstance = ReturnType<typeof createWinstonLogger>;

class WinstonAdapter implements AppLogger {
  public constructor(private readonly instance: WinstonInstance, private readonly baseContext: LogContext = {}) {}

  public child(bindings: LogContext): AppLogger {
    return new WinstonAdapter(this.instance, { ...this.baseContext, ...bindings });
  }

  public trace(message: string, context?: LogContext): void {
    this.log('trace', message, context);
  }

  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  public error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  public fatal(message: string, context?: LogContext): void {
    this.log('fatal', message, context);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    this.instance.log(level, message, {
      ...this.baseContext,
      ...normalizeContext(context),
    });
  }
}

class DualAdapter implements AppLogger {
  public constructor(private readonly delegates: AppLogger[]) {}

  public child(bindings: LogContext): AppLogger {
    return new DualAdapter(this.delegates.map((delegate) => delegate.child(bindings)));
  }

  public trace(message: string, context?: LogContext): void {
    this.delegates.forEach((delegate) => delegate.trace(message, context));
  }

  public debug(message: string, context?: LogContext): void {
    this.delegates.forEach((delegate) => delegate.debug(message, context));
  }

  public info(message: string, context?: LogContext): void {
    this.delegates.forEach((delegate) => delegate.info(message, context));
  }

  public warn(message: string, context?: LogContext): void {
    this.delegates.forEach((delegate) => delegate.warn(message, context));
  }

  public error(message: string, context?: LogContext): void {
    this.delegates.forEach((delegate) => delegate.error(message, context));
  }

  public fatal(message: string, context?: LogContext): void {
    this.delegates.forEach((delegate) => delegate.fatal(message, context));
  }
}

function createPinoAdapter(): AppLogger {
  const transport =
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined;

  const options: PinoLoggerOptions = {
    level: env.LOG_LEVEL,
  };

  if (transport) {
    options.transport = transport;
  }

  return new PinoAdapter(
    pino(options),
  );
}

function createWinstonAdapter(): AppLogger {
  const winstonLogger = createWinstonLogger({
    levels: winstonLevels,
    level: env.LOG_LEVEL,
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.colorize({ all: true }),
      format.printf(({ timestamp, level, message, ...metadata }) => {
        const timestampText = typeof timestamp === 'string' ? timestamp : new Date().toISOString();
        const levelText = typeof level === 'string' ? level : 'info';
        const messageText = typeof message === 'string' ? message : JSON.stringify(message);
        const meta = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
        return `${timestampText} ${levelText}: ${messageText}${meta}`;
      }),
    ),
    transports: [new transports.Console()],
  });

  return new WinstonAdapter(winstonLogger);
}

function buildLogger(): AppLogger {
  const pinoAdapter = createPinoAdapter();
  const winstonAdapter = createWinstonAdapter();

  switch (env.LOGGER_PROVIDER) {
    case 'pino':
      return pinoAdapter;
    case 'winston':
      return winstonAdapter;
    case 'dual':
    default:
      return new DualAdapter([pinoAdapter, winstonAdapter]);
  }
}

export const logger = buildLogger();
