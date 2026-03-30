import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceApprovalRulesRepository } from '@/repositories/finance/in-memory/in-memory-finance-approval-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateApprovalRuleUseCase } from './update-approval-rule';

let approvalRulesRepository: InMemoryFinanceApprovalRulesRepository;
let sut: UpdateApprovalRuleUseCase;

const TENANT_ID = 'tenant-1';
let seededRuleId: string;

describe('UpdateApprovalRuleUseCase', () => {
  beforeEach(async () => {
    approvalRulesRepository = new InMemoryFinanceApprovalRulesRepository();
    sut = new UpdateApprovalRuleUseCase(approvalRulesRepository);

    const rule = await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Original Rule',
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

  it('should update the rule name', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      name: 'Updated Rule Name',
    });

    expect(result.rule.name).toBe('Updated Rule Name');
    expect(result.rule.id).toBe(seededRuleId);
  });

  it('should update the action', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      action: 'FLAG_REVIEW',
    });

    expect(result.rule.action).toBe('FLAG_REVIEW');
  });

  it('should update isActive', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      isActive: false,
    });

    expect(result.rule.isActive).toBe(false);
  });

  it('should update maxAmount', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      maxAmount: 5000,
    });

    expect(result.rule.maxAmount).toBe(5000);
  });

  it('should clear maxAmount by setting it to null', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      maxAmount: null,
    });

    expect(result.rule.maxAmount).toBeUndefined();
  });

  it('should update priority', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      priority: 100,
    });

    expect(result.rule.priority).toBe(100);
  });

  it('should update conditions', async () => {
    const newConditions = {
      categoryIds: ['cat-a', 'cat-b'],
      supplierNames: ['Supplier X'],
      entryType: 'RECEIVABLE' as const,
      minRecurrence: 10,
    };

    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      conditions: newConditions,
    });

    expect(result.rule.conditions).toEqual(
      expect.objectContaining({
        categoryIds: ['cat-a', 'cat-b'],
        supplierNames: ['Supplier X'],
        entryType: 'RECEIVABLE',
        minRecurrence: 10,
      }),
    );
  });

  it('should update multiple fields at once', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      name: 'Multi Update',
      action: 'AUTO_PAY',
      maxAmount: 2500,
      priority: 50,
      isActive: false,
    });

    expect(result.rule.name).toBe('Multi Update');
    expect(result.rule.action).toBe('AUTO_PAY');
    expect(result.rule.maxAmount).toBe(2500);
    expect(result.rule.priority).toBe(50);
    expect(result.rule.isActive).toBe(false);
  });

  it('should trim the updated name', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      name: '  Trimmed  ',
    });

    expect(result.rule.name).toBe('Trimmed');
  });

  it('should throw if rule does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
        name: 'Does not matter',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw if rule belongs to a different tenant', async () => {
    await expect(
      sut.execute({
        id: seededRuleId,
        tenantId: 'other-tenant',
        name: 'Cross tenant',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw if updated name conflicts with existing rule in same tenant', async () => {
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Existing Name',
      action: 'FLAG_REVIEW',
    });

    await expect(
      sut.execute({
        id: seededRuleId,
        tenantId: TENANT_ID,
        name: 'Existing Name',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow keeping the same name (no conflict with itself)', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      name: 'Original Rule',
    });

    expect(result.rule.name).toBe('Original Rule');
  });

  it('should allow a name that exists in another tenant', async () => {
    await approvalRulesRepository.create({
      tenantId: 'other-tenant',
      name: 'Cross Tenant Name',
      action: 'FLAG_REVIEW',
    });

    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      name: 'Cross Tenant Name',
    });

    expect(result.rule.name).toBe('Cross Tenant Name');
  });

  it('should throw if maxAmount is zero', async () => {
    await expect(
      sut.execute({
        id: seededRuleId,
        tenantId: TENANT_ID,
        maxAmount: 0,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if maxAmount is negative', async () => {
    await expect(
      sut.execute({
        id: seededRuleId,
        tenantId: TENANT_ID,
        maxAmount: -50,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should set updatedAt after update', async () => {
    const result = await sut.execute({
      id: seededRuleId,
      tenantId: TENANT_ID,
      name: 'Triggers updatedAt',
    });

    expect(result.rule.updatedAt).toBeInstanceOf(Date);
  });
});
