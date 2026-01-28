import * as Sentry from '@sentry/node';
import { env } from '@/@env';

let isInitialized = false;

/**
 * Inicializa o Sentry para captura de erros e performance monitoring
 */
export function initSentry(): void {
  if (isInitialized) return;
  if (!env.SENTRY_DSN) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: `opensea-api@${process.env.npm_package_version || '1.0.0'}`,

    // Performance Monitoring
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling (opcional)
    profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0.5,

    // Erros a ignorar (erros esperados da aplicação)
    ignoreErrors: [
      'UnauthorizedError',
      'ForbiddenError',
      'ResourceNotFoundError',
      'BadRequestError',
      'UserBlockedError',
      'PasswordResetRequiredError',
      // Rate limiting
      'Too Many Requests',
      // Validação
      'Validation error',
    ],

    // Filtrar dados sensíveis antes de enviar
    beforeSend(event, _hint) {
      // Remove headers sensíveis
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove dados sensíveis do corpo
      if (event.request?.data) {
        const data =
          typeof event.request.data === 'string'
            ? JSON.parse(event.request.data)
            : event.request.data;

        if (data.password) data.password = '[REDACTED]';
        if (data.currentPassword) data.currentPassword = '[REDACTED]';
        if (data.newPassword) data.newPassword = '[REDACTED]';
        if (data.token) data.token = '[REDACTED]';
        if (data.refreshToken) data.refreshToken = '[REDACTED]';

        event.request.data = JSON.stringify(data);
      }

      return event;
    },

    // Filtrar breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Remove breadcrumbs de queries SQL com dados sensíveis
      if (breadcrumb.category === 'query' && breadcrumb.message) {
        if (
          breadcrumb.message.includes('password') ||
          breadcrumb.message.includes('token')
        ) {
          return null;
        }
      }
      return breadcrumb;
    },
  });

  isInitialized = true;
  console.log('[Sentry] Initialized successfully');
}

/**
 * Captura uma exceção no Sentry
 */
export function captureException(
  error: Error,
  context?: {
    userId?: string;
    endpoint?: string;
    method?: string;
    extra?: Record<string, unknown>;
    tags?: Record<string, string>;
  },
): void {
  if (!env.SENTRY_DSN) return;

  Sentry.captureException(error, {
    user: context?.userId ? { id: context.userId } : undefined,
    tags: {
      endpoint: context?.endpoint,
      method: context?.method,
      ...context?.tags,
    },
    extra: context?.extra,
  });
}

/**
 * Captura uma mensagem no Sentry
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>,
): void {
  if (!env.SENTRY_DSN) return;

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Define o usuário atual para o contexto do Sentry
 */
export function setUser(
  user: { id: string; email?: string; username?: string } | null,
): void {
  if (!env.SENTRY_DSN) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Adiciona um breadcrumb personalizado
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void {
  if (!env.SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

export { Sentry };
