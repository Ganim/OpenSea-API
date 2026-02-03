import { AuditLog } from '@/entities/audit/audit-log';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AuditLogsRepository } from '@/repositories/audit/audit-logs-repository';

interface ListAuditLogsUseCaseRequest {
  tenantId?: string;
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
      tenantId,
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

    const tenantIdEntity = tenantId ? new UniqueEntityID(tenantId) : undefined;

    // Se entity e entityId forem fornecidos, buscar por entidade específica
    if (entity && entityId) {
      const logs = await this.auditLogsRepository.listByEntity(
        entity as unknown as AuditEntity,
        entityId,
        { page, limit, tenantId: tenantIdEntity },
      );
      const total = await this.auditLogsRepository.count({
        entity: entity as unknown as AuditEntity,
        entityId,
        tenantId: tenantIdEntity,
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
      tenantId: tenantIdEntity,
      userId: userId ? new UniqueEntityID(userId) : undefined,
      affectedUser,
      action: action as unknown as AuditAction,
      entity: entity as unknown as AuditEntity,
      module: module as unknown as AuditModule,
      entityId,
      startDate,
      endDate,
      page,
      limit,
    });

    const total = await this.auditLogsRepository.count({
      tenantId: tenantIdEntity,
      userId: userId ? new UniqueEntityID(userId) : undefined,
      affectedUser,
      action: action as unknown as AuditAction,
      entity: entity as unknown as AuditEntity,
      module: module as unknown as AuditModule,
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
