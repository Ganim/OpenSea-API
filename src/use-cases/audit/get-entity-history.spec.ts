import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import { InMemoryAuditLogsRepository } from '@/repositories/audit/in-memory/in-memory-audit-logs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetEntityHistoryUseCase } from './get-entity-history';

let auditLogsRepository: InMemoryAuditLogsRepository;
let sut: GetEntityHistoryUseCase;

describe('GetEntityHistoryUseCase', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository();
    sut = new GetEntityHistoryUseCase(auditLogsRepository);
  });

  it('should return versioned history for an entity', async () => {
    await auditLogsRepository.log({
      action: AuditAction.CREATE,
      entity: AuditEntity.PRODUCT,
      module: AuditModule.STOCK,
      entityId: 'p1',
      newData: { name: 'W' },
    });
    await auditLogsRepository.log({
      action: AuditAction.UPDATE,
      entity: AuditEntity.PRODUCT,
      module: AuditModule.STOCK,
      entityId: 'p1',
      oldData: { name: 'W' },
      newData: { name: 'WP' },
    });
    const { history } = await sut.execute({
      entity: AuditEntity.PRODUCT,
      entityId: 'p1',
    });
    expect(history).toHaveLength(2);
    expect(history[0].version).toBe(1);
    expect(history[1].version).toBe(2);
  });

  it('should return empty history for unknown entity', async () => {
    const { history } = await sut.execute({
      entity: AuditEntity.PRODUCT,
      entityId: 'unknown',
    });
    expect(history).toHaveLength(0);
  });
});
