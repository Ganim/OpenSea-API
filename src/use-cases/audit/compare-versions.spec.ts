import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { InMemoryAuditLogsRepository } from '@/repositories/audit/in-memory/in-memory-audit-logs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CompareVersionsUseCase } from './compare-versions';

let auditLogsRepository: InMemoryAuditLogsRepository;
let sut: CompareVersionsUseCase;

describe('CompareVersionsUseCase', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository();
    sut = new CompareVersionsUseCase(auditLogsRepository);
  });

  it('should throw BadRequestError for non-positive version', async () => {
    await expect(() =>
      sut.execute({
        entity: AuditEntity.PRODUCT,
        entityId: 'x',
        version1: 0,
        version2: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError when no logs exist', async () => {
    await expect(() =>
      sut.execute({
        entity: AuditEntity.PRODUCT,
        entityId: 'm',
        version1: 1,
        version2: 2,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
