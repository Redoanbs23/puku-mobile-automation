type Level = 'info' | 'warn' | 'error' | 'debug';

function log(level: Level, message: string, meta?: unknown): void {
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  const consoleMethod = level === 'debug' ? 'log' : level;
  if (meta !== undefined) {
    console[consoleMethod](prefix, message, meta);
  } else {
    console[consoleMethod](prefix, message);
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
  debug: (message: string, meta?: unknown) => log('debug', message, meta),
};
