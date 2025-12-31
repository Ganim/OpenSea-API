import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditLogsRepository } from '@/repositories/audit/audit-logs-repository';

interface PreviewRollbackUseCaseRequest {
  entity: AuditEntity;
  entityId: string;
}

interface RollbackPreview {
  canRollback: boolean;
  reason?: string;
  targetState: Record<string, unknown> | null;
  currentState: Record<string, unknown> | null;
  changes: Array<{
    field: string;
    from: unknown;
    to: unknown;
  }>;
}

interface PreviewRollbackUseCaseResponse {
  preview: RollbackPreview;
}

export class PreviewRollbackUseCase {
  constructor(private auditLogsRepository: AuditLogsRepository) {}

  async execute(
    request: PreviewRollbackUseCaseRequest,
  ): Promise<PreviewRollbackUseCaseResponse> {
    const { entity, entityId } = request;

    const logs = await this.auditLogsRepository.listByEntity(entity, entityId, {
      page: 1,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    if (logs.length === 0) {
      return {
        preview: {
          canRollback: false,
          reason: 'No audit logs found for this entity',
          targetState: null,
          currentState: null,
          changes: [],
        },
      };
    }

    // Ordenar do mais recente para o mais antigo
    const sortedLogs = logs.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const latestLog = sortedLogs[0];

    // Não pode fazer rollback de CREATE
    if (latestLog.action === AuditAction.CREATE) {
      return {
        preview: {
          canRollback: false,
          reason: 'Cannot rollback a CREATE action',
          targetState: null,
          currentState: latestLog.newData,
          changes: [],
        },
      };
    }

    // Para UPDATE, usar oldData como targetState
    if (latestLog.action === AuditAction.UPDATE) {
      const targetState = latestLog.oldData || {};
      const currentState = latestLog.newData || {};
      const changes: Array<{ field: string; from: unknown; to: unknown }> = [];

      // Calcular mudanças
      const allKeys = new Set([
        ...Object.keys(targetState),
        ...Object.keys(currentState),
      ]);

      for (const key of allKeys) {
        if (
          JSON.stringify(targetState[key]) !== JSON.stringify(currentState[key])
        ) {
          changes.push({
            field: key,
            from: currentState[key],
            to: targetState[key],
          });
        }
      }

      return {
        preview: {
          canRollback: true,
          targetState,
          currentState,
          changes,
        },
      };
    }

    // Para DELETE, pode restaurar usando newData do log anterior
    if (latestLog.action === AuditAction.DELETE) {
      const previousLog = sortedLogs.find(
        (log) => log.action !== AuditAction.DELETE,
      );

      if (!previousLog) {
        return {
          preview: {
            canRollback: false,
            reason: 'No previous state found to restore',
            targetState: null,
            currentState: null,
            changes: [],
          },
        };
      }

      return {
        preview: {
          canRollback: true,
          targetState: previousLog.newData || {},
          currentState: null,
          changes: [],
        },
      };
    }

    return {
      preview: {
        canRollback: false,
        reason: 'Unsupported action type for rollback',
        targetState: null,
        currentState: null,
        changes: [],
      },
    };
  }
}
