import { AuditLog } from '@/entities/audit/audit-log';
import { AuditLogsRepository } from '@/repositories/audit/audit-logs-repository';

interface ListAuditLogsUseCaseRequest {
  userId?: string;
  affectedUser?: string;
  action?: string;
  entity?: string;
  module?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface ListAuditLogsUseCaseResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListAuditLogsUseCase {
  constructor(private auditLogsRepository: AuditLogsRepository) {}

  async execute(
    request: ListAuditLogsUseCaseRequest,
  ): Promise<ListAuditLogsUseCaseResponse> {
    const {
      userId,
      affectedUser,
      action,
      entity,
      module,
      entityId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = request;

    // Se entity e entityId forem fornecidos, buscar por entidade específica
    if (entity && entityId) {
      const logs = await this.auditLogsRepository.listByEntity(
        entity as any,
        entityId,
        { page, limit },
      );
      const total = await this.auditLogsRepository.count({
        entity: entity as any,
        entityId,
      });

      return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Buscar com filtros gerais
    const logs = await this.auditLogsRepository.listAll({
      userId,
      affectedUser,
      action: action as any,
      entity: entity as any,
      module: module as any,
      entityId,
      startDate,
      endDate,
      page,
      limit,
    });

    const total = await this.auditLogsRepository.count({
      userId,
      affectedUser,
      action: action as any,
      entity: entity as any,
      module: module as any,
      entityId,
      startDate,
      endDate,
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
