import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import { InMemoryAuditLogsRepository } from '@/repositories/audit/in-memory/in-memory-audit-logs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PreviewRollbackUseCase } from './preview-rollback';

let auditLogsRepository: InMemoryAuditLogsRepository;
let sut: PreviewRollbackUseCase;

describe('PreviewRollbackUseCase', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository();
    sut = new PreviewRollbackUseCase(auditLogsRepository);
  });

  it('should return canRollback false when no logs exist', async () => {
    const { preview } = await sut.execute({
      entity: AuditEntity.PRODUCT,
      entityId: 'm',
    });
    expect(preview.canRollback).toBe(false);
  });

  it('should return canRollback false for CREATE action', async () => {
    await auditLogsRepository.log({
      action: AuditAction.CREATE,
      entity: AuditEntity.PRODUCT,
      module: AuditModule.STOCK,
      entityId: 'p1',
      newData: { name: 'W' },
    });
    const { preview } = await sut.execute({
      entity: AuditEntity.PRODUCT,
      entityId: 'p1',
    });
    expect(preview.canRollback).toBe(false);
  });

  it('should return canRollback true for UPDATE action', async () => {
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
    const { preview } = await sut.execute({
      entity: AuditEntity.PRODUCT,
      entityId: 'p1',
    });
    expect(preview.canRollback).toBe(true);
  });
});
