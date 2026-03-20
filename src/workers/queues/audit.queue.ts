import { createLogger } from '@/lib/logger';

const auditLogger = createLogger('AUDIT');

export interface AuditLogJobData {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  module: string;
  description?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Registra um audit log via logger (fire-and-forget).
 * Os controllers já gravam auditorias no banco via logAudit().
 * Esta função serve como registro estruturado adicional para use cases
 * que não têm acesso ao request object.
 */
export async function queueAuditLog(data: AuditLogJobData): Promise<void> {
  auditLogger.info(
    {
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      module: data.module,
    },
    `Audit: ${data.action} on ${data.entity}:${data.entityId}`,
  );
}

/**
 * Registra múltiplos audit logs de uma vez
 */
export async function queueBulkAuditLogs(
  logs: AuditLogJobData[],
): Promise<void> {
  for (const data of logs) {
    await queueAuditLog(data);
  }
}
