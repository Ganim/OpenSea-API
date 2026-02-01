import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import { InMemoryAuditLogsRepository } from '@/repositories/audit/in-memory/in-memory-audit-logs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { LogAuditUseCase } from './log-audit';

let auditLogsRepository: InMemoryAuditLogsRepository;
let sut: LogAuditUseCase;

describe('LogAuditUseCase', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository();
    sut = new LogAuditUseCase(auditLogsRepository);
  });

  it('should log an audit entry', async () => {
    await sut.execute({
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      entityId: 'user-1',
      newData: { name: 'John' },
    });
    expect(auditLogsRepository.items).toHaveLength(1);
    expect(auditLogsRepository.items[0].module).toBe(AuditModule.CORE);
  });

  it('should map stock entities to STOCK module', async () => {
    await sut.execute({
      action: AuditAction.CREATE,
      entity: AuditEntity.PRODUCT,
      entityId: 'p1',
    });
    expect(auditLogsRepository.items[0].module).toBe(AuditModule.STOCK);
  });

  it('should sanitize sensitive data', async () => {
    await sut.execute({
      action: AuditAction.UPDATE,
      entity: AuditEntity.USER,
      entityId: 'u1',
      newData: { name: 'John', password: 'secret', email: 'j@t.com' },
    });
    expect(auditLogsRepository.items[0].newData!['password']).toBe(
      '[REDACTED]',
    );
    expect(auditLogsRepository.items[0].newData!['email']).toBe('j@t.com');
  });

  it('should not throw even if repository fails', async () => {
    const errorRepo = {
      log: async () => {
        throw new Error('fail');
      },
    } as unknown as InMemoryAuditLogsRepository;
    const failSut = new LogAuditUseCase(errorRepo);
    await expect(
      failSut.execute({
        action: AuditAction.CREATE,
        entity: AuditEntity.USER,
        entityId: 'u1',
      }),
    ).resolves.toBeUndefined();
  });
});
