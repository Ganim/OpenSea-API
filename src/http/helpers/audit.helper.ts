import type { AuditMessage } from '@/constants/audit-messages/types';
import { makeLogAuditUseCase } from '@/use-cases/audit/factories/make-log-audit-use-case';
import type { FastifyRequest } from 'fastify';

/**
 * Contexto extraído da requisição para auditoria
 */
interface AuditContext {
  userId?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
}

/**
 * Parâmetros para registrar um log de auditoria
 */
export interface LogAuditParams {
  /** Mensagem de auditoria com action, entity, module e description */
  message: AuditMessage;

  /** ID da entidade afetada */
  entityId: string;

  /**
   * Placeholders para substituir na descrição
   * Exemplo: { userName: 'João', employeeName: 'Maria' }
   */
  placeholders?: Record<string, string | number | null | undefined>;

  /** Estado anterior da entidade (para UPDATE/DELETE) */
  oldData?: Record<string, unknown> | null;

  /** Novos dados da entidade (para CREATE/UPDATE) */
  newData?: Record<string, unknown> | null;

  /** ID do usuário afetado pela ação (quando diferente do executor) */
  affectedUserId?: string;
}

/**
 * Extrai contexto de auditoria da requisição Fastify
 */
export function getAuditContextFromRequest(
  request: FastifyRequest,
): AuditContext {
  return {
    userId: request.user?.sub,
    tenantId: request.user?.tenantId,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    endpoint: request.url.split('?')[0], // Remove query params
    method: request.method,
  };
}

/**
 * Substitui placeholders {{key}} na string template pelos valores fornecidos
 *
 * @example
 * replacePlaceholders(
 *   '{{adminName}} criou o usuário {{userName}}',
 *   { adminName: 'João', userName: 'Maria' }
 * )
 * // Retorna: 'João criou o usuário Maria'
 */
function replacePlaceholders(
  template: string,
  placeholders: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = placeholders[key];
    if (value === null || value === undefined) {
      return match; // Mantém o placeholder se valor não existir
    }
    return String(value);
  });
}

/**
 * Sanitiza dados sensíveis antes de salvar no log
 * Remove senhas, tokens e outros dados confidenciais
 */
function sanitizeData(
  data: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!data) return null;

  const sensitiveFields = [
    'password',
    'passwordHash',
    'password_hash',
    'token',
    'refreshToken',
    'refresh_token',
    'accessToken',
    'access_token',
    'secret',
    'apiKey',
    'api_key',
    'creditCard',
    'credit_card',
    'cvv',
    'pin',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(
      (field) =>
        lowerKey === field.toLowerCase() ||
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret'),
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Registra um log de auditoria com contexto semântico
 *
 * @example
 * await logAudit(request, {
 *   message: AUDIT_MESSAGES.HR.EMPLOYEE_CREATE,
 *   entityId: employee.id,
 *   placeholders: {
 *     adminName: 'João Silva',
 *     employeeName: 'Maria Santos',
 *   },
 *   newData: employeeData,
 * });
 *
 * // Resulta em: "João Silva cadastrou o funcionário Maria Santos"
 */
export async function logAudit(
  request: FastifyRequest,
  params: LogAuditParams,
): Promise<void> {
  try {
    const context = getAuditContextFromRequest(request);
    const logAuditUseCase = makeLogAuditUseCase();

    // Substitui placeholders na descrição
    const description = params.placeholders
      ? replacePlaceholders(params.message.description, params.placeholders)
      : params.message.description;

    // Sanitiza dados sensíveis
    const sanitizedOldData = sanitizeData(params.oldData);
    const sanitizedNewData = sanitizeData(params.newData);

    // Inclui placeholders resolvidos em newData para o frontend poder estilizar
    const newDataWithPlaceholders = params.placeholders
      ? { ...sanitizedNewData, _placeholders: params.placeholders }
      : sanitizedNewData;

    await logAuditUseCase.execute({
      action: params.message.action,
      entity: params.message.entity,
      entityId: params.entityId,
      description,
      oldData: sanitizedOldData,
      newData: newDataWithPlaceholders,
      tenantId: context.tenantId,
      userId: context.userId,
      affectedUser: params.affectedUserId,
      ip: context.ip,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      method: context.method,
    });
  } catch (error) {
    // Log de auditoria não deve quebrar a operação principal
    console.error('[AUDIT] Falha ao registrar auditoria:', error);
  }
}

/**
 * Cria uma função de log pré-configurada com a mensagem
 * Útil para evitar repetição quando a mesma mensagem é usada múltiplas vezes
 *
 * @example
 * const logEmployeeCreate = createAuditLogger(AUDIT_MESSAGES.HR.EMPLOYEE_CREATE);
 *
 * await logEmployeeCreate(request, {
 *   entityId: employee.id,
 *   placeholders: { adminName: 'João', employeeName: 'Maria' },
 *   newData: data,
 * });
 */
export function createAuditLogger(message: AuditMessage) {
  return (
    request: FastifyRequest,
    params: Omit<LogAuditParams, 'message'>,
  ): Promise<void> => {
    return logAudit(request, { ...params, message });
  };
}
