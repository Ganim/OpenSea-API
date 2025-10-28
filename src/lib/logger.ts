/**
 * Logger Configuration (Pino)
 * Logger estruturado para toda a aplicação
 */

import { env } from '@/@env';
import pino from 'pino';

/**
 * Configuração do Pino
 */
const pinoConfig: pino.LoggerOptions = {
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',

  // Formatação de timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Configuração para desenvolvimento (pretty print)
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),

  // Configuração para produção (JSON estruturado)
  ...(env.NODE_ENV === 'production' && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  }),
};

/**
 * Logger principal da aplicação
 */
export const logger = pino(pinoConfig);

/**
 * Cria um logger child com contexto adicional
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * Logger para requisições HTTP
 */
export const httpLogger = createLogger('HTTP');

/**
 * Logger para banco de dados
 */
export const dbLogger = createLogger('DATABASE');

/**
 * Logger para autenticação
 */
export const authLogger = createLogger('AUTH');

/**
 * Logger para erros
 */
export const errorLogger = createLogger('ERROR');

/**
 * Logger para performance
 */
export const perfLogger = createLogger('PERFORMANCE');
