import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceApprovalRulesRepository } from '@/repositories/finance/in-memory/in-memory-finance-approval-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetApprovalRuleByIdUseCase } from './get-approval-rule-by-id';

let approvalRulesRepository: InMemoryFinanceApprovalRulesRepository;
let sut: GetApprovalRuleByIdUseCase;

const TENANT_ID = 'tenant-1';
let seededRuleId: string;

describe('GetApprovalRuleByIdUseCase', () => {
  beforeEach(async () => {
    approvalRulesRepository = new InMemoryFinanceApprovalRulesRepository();
    sut = new GetApprovalRuleByIdUseCase(approvalRulesRepository);

    const rule = await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Test Rule',
      action: 'AUTO_APPROVE',
      maxAmount: 1000,
      priority: 5,
      conditions: {
        categoryIds: ['cat-1'],
        entryType: 'PAYABLE',
      },
    });
    seededRuleId = rule.id.toString();
  });

  it('should return a rule by id', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
    });

    expect(result.rule).toEqual(
      expect.objectContaining({
        id: seededRuleId,
        tenantId: TENANT_ID,
        name: 'Test Rule',
        action: 'AUTO_APPROVE',
        isActive: true,
        maxAmount: 1000,
        priority: 5,
        appliedCount: 0,
      }),
    );
    expect(result.rule.createdAt).toBeInstanceOf(Date);
    expect(result.rule.conditions).toEqual(
      expect.objectContaining({
        categoryIds: ['cat-1'],
        entryType: 'PAYABLE',
      }),
    );
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

  it('should throw if rule has been soft-deleted', async () => {
    const { UniqueEntityID } = await import(
      '@/entities/domain/unique-entity-id'
    );
    await approvalRulesRepository.delete(
      new UniqueEntityID(seededRuleId),
      TENANT_ID,
    );

    await expect(
      sut.execute({
        id: seededRuleId,
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return rule with all optional fields populated', async () => {
    const fullRule = await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Full Rule',
      action: 'AUTO_PAY',
      isActive: false,
      maxAmount: 5000,
      priority: 20,
      conditions: {
        categoryIds: ['cat-a', 'cat-b'],
        supplierNames: ['Supplier X'],
        entryType: 'RECEIVABLE',
        minRecurrence: 5,
      },
    });

    const result = await sut.execute({
      id: fullRule.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.rule.name).toBe('Full Rule');
    expect(result.rule.action).toBe('AUTO_PAY');
    expect(result.rule.isActive).toBe(false);
    expect(result.rule.maxAmount).toBe(5000);
    expect(result.rule.priority).toBe(20);
  });
});
