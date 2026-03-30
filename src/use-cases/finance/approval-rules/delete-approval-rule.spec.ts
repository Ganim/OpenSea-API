import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceApprovalRulesRepository } from '@/repositories/finance/in-memory/in-memory-finance-approval-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteApprovalRuleUseCase } from './delete-approval-rule';

let approvalRulesRepository: InMemoryFinanceApprovalRulesRepository;
let sut: DeleteApprovalRuleUseCase;

const TENANT_ID = 'tenant-1';
let seededRuleId: string;

describe('DeleteApprovalRuleUseCase', () => {
  beforeEach(async () => {
    approvalRulesRepository = new InMemoryFinanceApprovalRulesRepository();
    sut = new DeleteApprovalRuleUseCase(approvalRulesRepository);

    const rule = await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Rule to delete',
      action: 'AUTO_APPROVE',
      maxAmount: 500,
      priority: 3,
    });
    seededRuleId = rule.id.toString();
  });

  it('should soft delete a rule', async () => {
    await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
    });

    const deletedRule = approvalRulesRepository.items.find(
      (i) => i.id.toString() === seededRuleId,
    );
    expect(deletedRule?.deletedAt).toBeDefined();
    expect(deletedRule?.deletedAt).toBeInstanceOf(Date);
  });

  it('should not be retrievable after deletion', async () => {
    await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
    });

    const found = await approvalRulesRepository.findById(
      new UniqueEntityID(seededRuleId),
      TENANT_ID,
    );
    expect(found).toBeNull();
  });

  it('should throw if rule does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw if rule belongs to a different tenant', async () => {
    await expect(
      sut.execute({
        id: seededRuleId,
        tenantId: 'other-tenant',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw if rule has already been deleted', async () => {
    await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
    });

    await expect(
      sut.execute({
        id: seededRuleId,
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not affect other rules when deleting one', async () => {
    const otherRule = await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Other Rule',
      action: 'FLAG_REVIEW',
    });

    await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
    });

    const found = await approvalRulesRepository.findById(
      otherRule.id,
      TENANT_ID,
    );
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Other Rule');
    expect(found?.deletedAt).toBeUndefined();
  });

  it('should still exist in repository items after soft delete', async () => {
    const initialCount = approvalRulesRepository.items.length;

    await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
    });

    // Soft delete does not remove from array
    expect(approvalRulesRepository.items).toHaveLength(initialCount);
  });
});
