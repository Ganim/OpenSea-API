import { InMemoryFinanceApprovalRulesRepository } from '@/repositories/finance/in-memory/in-memory-finance-approval-rules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListApprovalRulesUseCase } from './list-approval-rules';

let approvalRulesRepository: InMemoryFinanceApprovalRulesRepository;
let sut: ListApprovalRulesUseCase;

const TENANT_ID = 'tenant-1';

describe('ListApprovalRulesUseCase', () => {
  beforeEach(() => {
    approvalRulesRepository = new InMemoryFinanceApprovalRulesRepository();
    sut = new ListApprovalRulesUseCase(approvalRulesRepository);
  });

  it('should return an empty list when no rules exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.rules).toHaveLength(0);
    expect(result.meta.total).toBe(0);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
    expect(result.meta.pages).toBe(0);
  });

  it('should list all rules for a tenant', async () => {
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Rule 1',
      action: 'AUTO_APPROVE',
    });
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Rule 2',
      action: 'FLAG_REVIEW',
    });
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Rule 3',
      action: 'AUTO_PAY',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.rules).toHaveLength(3);
    expect(result.meta.total).toBe(3);
    expect(result.meta.pages).toBe(1);
  });

  it('should not return rules from other tenants', async () => {
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Tenant 1 Rule',
      action: 'AUTO_APPROVE',
    });
    await approvalRulesRepository.create({
      tenantId: 'other-tenant',
      name: 'Other Tenant Rule',
      action: 'AUTO_APPROVE',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].name).toBe('Tenant 1 Rule');
    expect(result.meta.total).toBe(1);
  });

  it('should paginate results', async () => {
    for (let i = 1; i <= 5; i++) {
      await approvalRulesRepository.create({
        tenantId: TENANT_ID,
        name: `Rule ${i}`,
        action: 'AUTO_APPROVE',
      });
    }

    const page1 = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 2,
    });

    expect(page1.rules).toHaveLength(2);
    expect(page1.meta.total).toBe(5);
    expect(page1.meta.page).toBe(1);
    expect(page1.meta.limit).toBe(2);
    expect(page1.meta.pages).toBe(3);

    const page2 = await sut.execute({
      tenantId: TENANT_ID,
      page: 2,
      limit: 2,
    });

    expect(page2.rules).toHaveLength(2);
    expect(page2.meta.page).toBe(2);

    const page3 = await sut.execute({
      tenantId: TENANT_ID,
      page: 3,
      limit: 2,
    });

    expect(page3.rules).toHaveLength(1);
  });

  it('should filter by isActive', async () => {
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Active Rule',
      action: 'AUTO_APPROVE',
      isActive: true,
    });
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Inactive Rule',
      action: 'AUTO_APPROVE',
      isActive: false,
    });

    const activeResult = await sut.execute({
      tenantId: TENANT_ID,
      isActive: true,
    });
    expect(activeResult.rules).toHaveLength(1);
    expect(activeResult.rules[0].name).toBe('Active Rule');

    const inactiveResult = await sut.execute({
      tenantId: TENANT_ID,
      isActive: false,
    });
    expect(inactiveResult.rules).toHaveLength(1);
    expect(inactiveResult.rules[0].name).toBe('Inactive Rule');
  });

  it('should filter by action type', async () => {
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Auto Approve',
      action: 'AUTO_APPROVE',
    });
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Auto Pay',
      action: 'AUTO_PAY',
    });
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'Flag Review',
      action: 'FLAG_REVIEW',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      action: 'AUTO_PAY',
    });

    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].name).toBe('Auto Pay');
    expect(result.meta.total).toBe(1);
  });

  it('should use default pagination values', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
  });

  it('should cap limit at 100', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      limit: 500,
    });

    expect(result.meta.limit).toBe(100);
  });

  it('should not return soft-deleted rules', async () => {
    const rule = await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'To Delete',
      action: 'AUTO_APPROVE',
    });

    const { UniqueEntityID } = await import(
      '@/entities/domain/unique-entity-id'
    );
    await approvalRulesRepository.delete(
      new UniqueEntityID(rule.id.toString()),
      TENANT_ID,
    );

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.rules).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should return correct DTO structure', async () => {
    await approvalRulesRepository.create({
      tenantId: TENANT_ID,
      name: 'DTO Check',
      action: 'FLAG_REVIEW',
      maxAmount: 999,
      priority: 7,
      conditions: { categoryIds: ['c-1'] },
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.rules[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        tenantId: TENANT_ID,
        name: 'DTO Check',
        action: 'FLAG_REVIEW',
        isActive: true,
        maxAmount: 999,
        priority: 7,
        appliedCount: 0,
        createdAt: expect.any(Date),
      }),
    );
  });
});
