import { Job } from 'bullmq';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

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

// Cria a fila de audit logs
export const auditQueue = createQueue<AuditLogJobData>(QUEUE_NAMES.AUDIT_LOGS);

/**
 * Adiciona um audit log à fila
 * Usar para operações de alto volume onde não é crítico ter sincronia
 */
export async function queueAuditLog(data: AuditLogJobData) {
  return auditQueue.add(QUEUE_NAMES.AUDIT_LOGS, data, {
    // Audit logs têm alta prioridade
    priority: 1,
  });
}

/**
 * Adiciona múltiplos audit logs à fila de uma vez
 */
export async function queueBulkAuditLogs(logs: AuditLogJobData[]) {
  const jobs = logs.map((data) => ({
    name: QUEUE_NAMES.AUDIT_LOGS,
    data,
    opts: { priority: 1 },
  }));

  return auditQueue.addBulk(jobs);
}

/**
 * Inicia o worker de processamento de audit logs
 */
export function startAuditWorker() {
  return createWorker<AuditLogJobData>(
    QUEUE_NAMES.AUDIT_LOGS,
    async (job: Job<AuditLogJobData>) => {
      const { action, entity, entityId, module } = job.data;

      console.log(
        `[AuditWorker] Processing audit log: ${action} on ${entity}:${entityId} in ${module}`,
      );

      // TODO: Implementar criação real do audit log no banco
      // await prisma.auditLog.create({
      //   data: {
      //     userId: job.data.userId,
      //     action,
      //     entity,
      //     entityId,
      //     module,
      //     description: job.data.description,
      //     oldData: job.data.oldData,
      //     newData: job.data.newData,
      //     metadata: job.data.metadata,
      //     ip: job.data.ip,
      //     userAgent: job.data.userAgent,
      //   },
      // });

      console.log(`[AuditWorker] Audit log created for ${entity}:${entityId}`);
    },
    {
      concurrency: 20, // Alta concorrência para audit logs
      limiter: {
        max: 100,
        duration: 1000, // 100 logs por segundo
      },
    },
  );
}
