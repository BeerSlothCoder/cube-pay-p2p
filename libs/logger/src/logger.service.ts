import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: string;
  [key: string]: unknown;
}

@Injectable({ scope: Scope.TRANSIENT })
export class CubePayLogger implements NestLoggerService {
  private serviceName = 'cubepay';

  setContext(service: string) {
    this.serviceName = service;
  }

  private write(level: LogLevel, message: string, context?: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...(context && { context }),
      ...meta,
    };
    // Structured JSON — picked up by Cloudwatch / Datadog / Loki
    process.stdout.write(JSON.stringify(entry) + '\n');
  }

  log(message: string, context?: string)   { this.write('info',  message, context); }
  warn(message: string, context?: string)  { this.write('warn',  message, context); }
  error(message: string, context?: string) { this.write('error', message, context); }
  debug(message: string, context?: string) { this.write('debug', message, context); }
  verbose(message: string, context?: string) { this.write('debug', message, context); }

  /** Use for security events — always emitted at 'warn' or above */
  security(event: string, meta: Record<string, unknown>) {
    this.write('warn', event, 'SECURITY', { ...meta, security_event: true });
  }

  /** Use for audit events — compliance-grade structured log */
  audit(event: string, meta: Record<string, unknown>) {
    this.write('info', event, 'AUDIT', { ...meta, audit_event: true });
  }
}
