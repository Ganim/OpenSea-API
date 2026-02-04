import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditLogsRepository } from '@/repositories/audit/audit-logs-repository';

interface CompareVersionsUseCaseRequest {
  entity: AuditEntity;
  entityId: string;
  version1: number;
  version2: number;
  tenantId?: string;
}

interface CompareVersionsUseCaseResponse {
  comparison: {
    version1: {
      version: number;
      timestamp: Date;
      data: Record<string, unknown> | null;
    };
    version2: {
      version: number;
      timestamp: Date;
      data: Record<string, unknown> | null;
    };
    differences: Array<{
      field: string;
      version1Value: unknown;
      version2Value: unknown;
    }>;
    totalDifferences: number;
  };
}

export class CompareVersionsUseCase {
  constructor(private auditLogsRepository: AuditLogsRepository) {}

  async execute(
    request: CompareVersionsUseCaseRequest,
  ): Promise<CompareVersionsUseCaseResponse> {
    const { entity, entityId, version1, version2, tenantId } = request;

    if (version1 <= 0 || version2 <= 0) {
      throw new BadRequestError('Version numbers must be positive integers');
    }

    const logs = await this.auditLogsRepository.listByEntity(entity, entityId, {
      page: 1,
      limit: 1000,
      sortBy: 'createdAt',
      sortOrder: 'asc',
      tenantId: tenantId ? new UniqueEntityID(tenantId) : undefined,
    });

    if (logs.length === 0) {
      throw new ResourceNotFoundError('No audit logs found for this entity');
    }

    // Ordenar do mais antigo para o mais recente
    const sortedLogs = logs.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    // Versões começam em 1
    const log1 = sortedLogs[version1 - 1];
    const log2 = sortedLogs[version2 - 1];

    if (!log1 || !log2) {
      throw new BadRequestError(
        `Version ${!log1 ? version1 : version2} does not exist. Total versions: ${logs.length}`,
      );
    }

    const data1 = log1.newData || {};
    const data2 = log2.newData || {};

    // Calcular diferenças
    const differences: Array<{
      field: string;
      version1Value: unknown;
      version2Value: unknown;
    }> = [];

    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

    for (const key of allKeys) {
      if (JSON.stringify(data1[key]) !== JSON.stringify(data2[key])) {
        differences.push({
          field: key,
          version1Value: data1[key],
          version2Value: data2[key],
        });
      }
    }

    return {
      comparison: {
        version1: {
          version: version1,
          timestamp: log1.createdAt,
          data: data1,
        },
        version2: {
          version: version2,
          timestamp: log2.createdAt,
          data: data2,
        },
        differences,
        totalDifferences: differences.length,
      },
    };
  }
}
