import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { getAuditContext } from '@/http/hooks/audit-context.hook';
import { makeLogAuditUseCase } from '@/use-cases/audit/factories/make-log-audit-use-case';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Plugin Fastify para registro automático de audit logs
 *
 * Intercepta TODAS as requisições e registra no audit log automaticamente
 * baseado no método HTTP e rota acessada.
 *
 * Ignoradas:
 * - GET requests (somente consultas, não precisam de audit)
 * - Health check routes
 * - Auth routes (já têm audit específico)
 * - Rotas de audit (evita recursão)
 */

// Map do primeiro segmento do path para uma entidade de auditoria
const ENTITY_SEGMENT_MAP: Record<string, AuditEntity> = {
  // Core
  users: AuditEntity.USER,
  sessions: AuditEntity.SESSION,

  // RBAC
  permissions: AuditEntity.PERMISSION,
  'permission-groups': AuditEntity.PERMISSION_GROUP,
  associations: AuditEntity.USER_PERMISSION_GROUP,
  'user-direct-permissions': AuditEntity.USER_DIRECT_PERMISSION,

  // Stock
  products: AuditEntity.PRODUCT,
  variants: AuditEntity.VARIANT,
  items: AuditEntity.ITEM,
  categories: AuditEntity.CATEGORY,
  suppliers: AuditEntity.SUPPLIER,
  manufacturers: AuditEntity.MANUFACTURER,
  locations: AuditEntity.LOCATION,
  templates: AuditEntity.TEMPLATE,
  'item-movements': AuditEntity.ITEM_MOVEMENT,
  'purchase-orders': AuditEntity.PURCHASE_ORDER,
  tags: AuditEntity.TAG,
  'variant-promotions': AuditEntity.VARIANT_PROMOTION,

  // Sales
  customers: AuditEntity.CUSTOMER,
  'sales-orders': AuditEntity.SALES_ORDER,
  comments: AuditEntity.COMMENT,
  'item-reservations': AuditEntity.ITEM_RESERVATION,

  // Notifications
  notifications: AuditEntity.NOTIFICATION,
  'notification-preferences': AuditEntity.NOTIFICATION_PREFERENCE,

  // Requests (Workflow)
  requests: AuditEntity.REQUEST,

  // HR
  employees: AuditEntity.EMPLOYEE,
  departments: AuditEntity.DEPARTMENT,
  positions: AuditEntity.POSITION,
  'time-control': AuditEntity.TIME_ENTRY,
  'work-schedules': AuditEntity.WORK_SCHEDULE,
  overtime: AuditEntity.OVERTIME,
  'time-bank': AuditEntity.TIME_BANK,
  absences: AuditEntity.ABSENCE,
  'vacation-periods': AuditEntity.VACATION_PERIOD,
  payrolls: AuditEntity.PAYROLL,
  bonuses: AuditEntity.BONUS,
  deductions: AuditEntity.DEDUCTION,
};

function shouldIgnoreRoute(method: string, url: string): boolean {
  if (method === 'GET') return true; // consultas não são auditadas
  if (url.includes('/health')) return true; // health check
  if (url.includes('/audit-logs')) return true; // evita recursão
  if (url.includes('/sessions/refresh')) return true; // rota técnica
  return false;
}

function getPrimaryPathSegment(url: string): string | null {
  const cleanUrl = url.split('?')[0];
  const segments = cleanUrl.split('/').filter(Boolean);

  if (segments[0] === 'v1' && segments.length > 1) {
    return segments[1];
  }

  return segments[0] ?? null;
}

function mapMethodToAction(method: string, url: string): AuditAction | null {
  // Tratamento especial para login
  if (method === 'POST' && url.includes('/auth/login')) {
    return AuditAction.LOGIN;
  }

  // Tratamento especial para logout
  if (
    (method === 'POST' || method === 'DELETE' || method === 'PATCH') &&
    url.includes('/sessions/logout')
  ) {
    return AuditAction.LOGOUT;
  }

  // Mapeamento padrão baseado em método HTTP
  if (method === 'POST') return AuditAction.CREATE;
  if (method === 'PUT' || method === 'PATCH') return AuditAction.UPDATE;
  if (method === 'DELETE') return AuditAction.DELETE;
  return null;
}

function inferEntity(url: string): AuditEntity {
  // Tratamento especial para auth/login
  if (url.includes('/auth/login')) {
    return AuditEntity.SESSION;
  }

  // Tratamento especial para sessions
  if (url.includes('/sessions')) {
    return AuditEntity.SESSION;
  }

  const segment = getPrimaryPathSegment(url);
  if (segment && ENTITY_SEGMENT_MAP[segment]) {
    return ENTITY_SEGMENT_MAP[segment];
  }

  return AuditEntity.OTHER;
}

function parsePayload(payload: any): any {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (error) {
      return payload;
    }
  }

  if (Buffer.isBuffer(payload)) {
    try {
      return JSON.parse(payload.toString());
    } catch (error) {
      return payload.toString();
    }
  }

  return payload;
}

function extractEntityId(
  request: FastifyRequest,
  responseBody: any,
): string | null {
  const params = request.params as Record<string, any> | undefined;

  // Prioridade: param chamado "id"
  if (params?.id && typeof params.id === 'string') {
    return params.id;
  }

  // Depois: qualquer param terminado em "Id"
  if (params) {
    const idParam = Object.entries(params).find(
      ([key, value]) =>
        key.toLowerCase().endsWith('id') && typeof value === 'string',
    );

    if (idParam) {
      return idParam[1];
    }
  }

  // Para PUT/PATCH/DELETE tentar último segmento do path
  if (['PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const cleanUrl = request.url.split('?')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.length > 5) {
      return last;
    }
  }

  // Para POST, tentar achar um id no corpo de resposta
  if (responseBody && typeof responseBody === 'object') {
    if (typeof responseBody.id === 'string') {
      return responseBody.id;
    }

    // Procurar profundamente o primeiro objeto que contenha id
    const stack = [responseBody];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || typeof current !== 'object') continue;

      if (typeof current.id === 'string') {
        return current.id;
      }

      for (const value of Object.values(current)) {
        if (value && typeof value === 'object') {
          stack.push(value);
        }
      }
    }
  }

  return null;
}

// Storage para oldData capturado antes da operação
const oldDataStorage = new Map<string, any>();

function getRequestKey(request: FastifyRequest): string {
  return `${request.id}-${request.method}-${request.url}`;
}

async function auditLoggerPlugin(fastify: FastifyInstance): Promise<void> {
  // Hook onRequest para capturar oldData ANTES da operação (para UPDATE/DELETE)
  fastify.addHook(
    'onRequest',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (shouldIgnoreRoute(request.method, request.url)) return;

      const action = mapMethodToAction(request.method, request.url);
      if (
        !action ||
        action === AuditAction.CREATE ||
        action === AuditAction.LOGIN
      )
        return;

      // Para UPDATE/DELETE/LOGOUT, tentar capturar estado atual
      try {
        const params = request.params as Record<string, any> | undefined;
        if (params?.id || params) {
          // Armazenar params como oldData (contém o estado antes da operação)
          const requestKey = getRequestKey(request);
          oldDataStorage.set(requestKey, { ...params });
        }
      } catch (error) {
        // Silencioso - não bloquear request por erro no audit
      }
    },
  );

  // Usa onSend para ter acesso ao payload da resposta (útil para pegar IDs criados)
  fastify.addHook(
    'onSend',
    async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
      if (shouldIgnoreRoute(request.method, request.url)) return payload;

      // Não auditar respostas de erro
      if (reply.statusCode >= 400) return payload;

      const action = mapMethodToAction(request.method, request.url);
      if (!action) return payload; // só audita mutações

      try {
        const context = getAuditContext();
        const responseBody = parsePayload(payload);
        const entity = inferEntity(request.url);
        const entityId = extractEntityId(request, responseBody) || 'unknown';

        // Recuperar oldData se existir
        const requestKey = getRequestKey(request);
        const oldData = oldDataStorage.get(requestKey);
        oldDataStorage.delete(requestKey); // Limpar após uso

        const logAudit = makeLogAuditUseCase();

        await logAudit.execute({
          action,
          entity,
          entityId,
          oldData: oldData || null,
          newData: request.body as any,
          userId: context?.userId,
          ip: context?.ip,
          userAgent: context?.userAgent,
          endpoint: context?.endpoint,
          method: context?.method,
          description: `${action} on ${entity}`,
        });
      } catch (error) {
        // Não interromper a resposta por erro no audit
        console.error('[AUDIT] Failed to log:', error);
      }

      return payload;
    },
  );
}

export default fp(auditLoggerPlugin, {
  name: 'audit-logger',
  fastify: '5.x',
});
