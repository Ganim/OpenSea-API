import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryFinanceApprovalRulesRepository } from '@/repositories/finance/in-memory/in-memory-finance-approval-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateApprovalRuleUseCase } from './create-approval-rule';

let approvalRulesRepository: InMemoryFinanceApprovalRulesRepository;
let sut: CreateApprovalRuleUseCase;

const TENANT_ID = 'tenant-1';

describe('CreateApprovalRuleUseCase', () => {
  beforeEach(() => {
    approvalRulesRepository = new InMemoryFinanceApprovalRulesRepository();
    sut = new CreateApprovalRuleUseCase(approvalRulesRepository);
  });

  it('should create an approval rule with minimal fields', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Auto approve small payments',
      action: 'AUTO_APPROVE',
    });

    expect(result.rule).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        tenantId: TENANT_ID,
        name: 'Auto approve small payments',
        action: 'AUTO_APPROVE',
        isActive: true,
        priority: 0,
        appliedCount: 0,
      }),
    );
    expect(result.rule.createdAt).toBeInstanceOf(Date);
    expect(approvalRulesRepository.items).toHaveLength(1);
  });

  it('should create a rule with all optional fields', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Full rule',
      action: 'AUTO_PAY',
      isActive: false,
      maxAmount: 500,
      priority: 10,
      conditions: {
        categoryIds: ['cat-1', 'cat-2'],
        supplierNames: ['Fornecedor A'],
        entryType: 'PAYABLE',
        minRecurrence: 3,
      },
    });

    expect(result.rule.name).toBe('Full rule');
    expect(result.rule.action).toBe('AUTO_PAY');
    expect(result.rule.isActive).toBe(false);
    expect(result.rule.maxAmount).toBe(500);
    expect(result.rule.priority).toBe(10);
    expect(result.rule.conditions).toEqual(
      expect.objectContaining({
        categoryIds: ['cat-1', 'cat-2'],
        supplierNames: ['Fornecedor A'],
        entryType: 'PAYABLE',
        minRecurrence: 3,
      }),
    );
  });

  it('should create a rule with FLAG_REVIEW action', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Flag for review',
      action: 'FLAG_REVIEW',
      maxAmount: 10000,
    });

    expect(result.rule.action).toBe('FLAG_REVIEW');
    expect(result.rule.maxAmount).toBe(10000);
  });

  it('should trim the rule name', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: '  Trimmed Name  ',
      action: 'AUTO_APPROVE',
    });

    expect(result.rule.name).toBe('Trimmed Name');
  });

  it('should throw if name is empty', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: '',
        action: 'AUTO_APPROVE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if name is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: '   ',
        action: 'AUTO_APPROVE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if action is invalid', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Invalid action rule',
        action: 'INVALID_ACTION' as never,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if maxAmount is zero', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Zero max amount',
        action: 'AUTO_APPROVE',
        maxAmount: 0,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if maxAmount is negative', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Negative max amount',
        action: 'AUTO_APPROVE',
        maxAmount: -100,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw if a rule with the same name already exists in the same tenant', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      name: 'Duplicate Name',
      action: 'AUTO_APPROVE',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        name: 'Duplicate Name',
        action: 'FLAG_REVIEW',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow the same name in different tenants', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      name: 'Shared Name',
      action: 'AUTO_APPROVE',
    });

    const result = await sut.execute({
      tenantId: 'tenant-2',
      name: 'Shared Name',
      action: 'AUTO_APPROVE',
    });

    expect(result.rule.name).toBe('Shared Name');
    expect(result.rule.tenantId).toBe('tenant-2');
    expect(approvalRulesRepository.items).toHaveLength(2);
  });

  it('should allow creating a rule without maxAmount', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'No max amount',
      action: 'AUTO_APPROVE',
    });

    expect(result.rule.maxAmount).toBeUndefined();
  });

  it('should allow creating a rule with empty conditions', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Empty conditions',
      action: 'AUTO_APPROVE',
      conditions: {},
    });

    expect(result.rule.conditions).toEqual({});
  });
});
