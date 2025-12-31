import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AuditLog } from '@/entities/audit/audit-log';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import { InMemoryAuditLogsRepository } from '@/repositories/audit/in-memory/in-memory-audit-logs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAuditLogsUseCase } from './list-audit-logs';

let auditLogsRepository: InMemoryAuditLogsRepository;
let sut: ListAuditLogsUseCase;

describe('ListAuditLogsUseCase', () => {
  beforeEach(() => {
    auditLogsRepository = new InMemoryAuditLogsRepository();
    sut = new ListAuditLogsUseCase(auditLogsRepository);
  });

  it('should list all audit logs', async () => {
    // Create 3 logs
    for (let i = 0; i < 3; i++) {
      const log = AuditLog.create({
        action: AuditAction.CREATE,
        entity: AuditEntity.PRODUCT,
        module: AuditModule.STOCK,
        entityId: `product-${i}`,
        newData: { name: `Product ${i}` },
      });
      await auditLogsRepository.log(log);
    }

    const result = await sut.execute({});

    expect(result.logs).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should filter logs by userId', async () => {
    const userId = new UniqueEntityID();
    const otherUserId = new UniqueEntityID();

    await auditLogsRepository.log(
      AuditLog.create({
        action: AuditAction.CREATE,
        entity: AuditEntity.PRODUCT,
        module: AuditModule.STOCK,
        entityId: 'product-1',
        userId,
      }),
    );

    await auditLogsRepository.log(
      AuditLog.create({
        action: AuditAction.CREATE,
        entity: AuditEntity.PRODUCT,
        module: AuditModule.STOCK,
        entityId: 'product-2',
        userId: otherUserId,
      }),
    );

    const result = await sut.execute({ userId: userId.toString() });

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].userId?.toString()).toBe(userId.toString());
  });

  it('should filter logs by entity', async () => {
    await auditLogsRepository.log(
      AuditLog.create({
        action: AuditAction.CREATE,
        entity: AuditEntity.PRODUCT,
        module: AuditModule.STOCK,
        entityId: 'product-1',
      }),
    );

    await auditLogsRepository.log(
      AuditLog.create({
        action: AuditAction.CREATE,
        entity: AuditEntity.USER,
        module: AuditModule.CORE,
        entityId: 'user-1',
      }),
    );

    const result = await sut.execute({ entity: AuditEntity.PRODUCT });

    expect(result.logs).toHaveLength(1);
    expect(result.logs[0].entity).toBe(AuditEntity.PRODUCT);
  });

  it('should filter logs by entity and entityId', async () => {
    await auditLogsRepository.log(
      AuditLog.create({
        action: AuditAction.CREATE,
        entity: AuditEntity.PRODUCT,
        module: AuditModule.STOCK,
        entityId: 'product-1',
      }),
    );

    await auditLogsRepository.log(
      AuditLog.create({
        action: AuditAction.UPDATE,
        entity: AuditEntity.PRODUCT,
        module: AuditModule.STOCK,
        entityId: 'product-1',
      }),
    );

    await auditLogsRepository.log(
      AuditLog.create({
        action: AuditAction.CREATE,
        entity: AuditEntity.PRODUCT,
        module: AuditModule.STOCK,
        entityId: 'product-2',
      }),
    );

    const result = await sut.execute({
      entity: AuditEntity.PRODUCT,
      entityId: 'product-1',
    });

    expect(result.logs).toHaveLength(2);
    result.logs.forEach((log) => {
      expect(log.entityId).toBe('product-1');
    });
  });

  it('should paginate results', async () => {
    // Create 25 logs
    for (let i = 0; i < 25; i++) {
      await auditLogsRepository.log(
        AuditLog.create({
          action: AuditAction.CREATE,
          entity: AuditEntity.PRODUCT,
          module: AuditModule.STOCK,
          entityId: `product-${i}`,
        }),
      );
    }

    const result = await sut.execute({ page: 1, limit: 10 });

    expect(result.logs.length).toBeLessThanOrEqual(10);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(3);
  });
});
