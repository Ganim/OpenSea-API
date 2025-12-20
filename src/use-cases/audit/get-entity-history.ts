import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditLogsRepository } from '@/repositories/audit/audit-logs-repository';

interface GetEntityHistoryUseCaseRequest {
  entity: AuditEntity;
  entityId: string;
}

interface HistoryVersion {
  version: number;
  action: string;
  timestamp: Date;
  userId: string | null;
  data: Record<string, any> | null;
  changes?: Record<string, { old: any; new: any }> | null;
  description: string | null;
}

interface GetEntityHistoryUseCaseResponse {
  history: HistoryVersion[];
}

export class GetEntityHistoryUseCase {
  constructor(private auditLogsRepository: AuditLogsRepository) {}

  async execute(
    request: GetEntityHistoryUseCaseRequest,
  ): Promise<GetEntityHistoryUseCaseResponse> {
    const { entity, entityId } = request;

    const logs = await this.auditLogsRepository.listByEntity(entity, entityId, {
      page: 1,
      limit: 1000,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });

    // Ordenar do mais antigo para o mais recente
    const sortedLogs = logs.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const history: HistoryVersion[] = sortedLogs.map((log, index) => ({
      version: index + 1,
      action: log.action,
      timestamp: log.createdAt,
      userId: log.userId ? log.userId.toString() : null,
      data: log.newData,
      changes: log.isUpdateAction ? log.getDiff() : null,
      description: log.description,
    }));

    return { history };
  }
}
