import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';

import { GetDashboardQuickActionsUseCase } from './get-dashboard-quick-actions';

let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let bankReconciliationsRepository: InMemoryBankReconciliationsRepository;
let sut: GetDashboardQuickActionsUseCase;

const TENANT_ID = 'tenant-1';

describe('GetDashboardQuickActionsUseCase', () => {
  beforeEach(() => {
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    bankReconciliationsRepository = new InMemoryBankReconciliationsRepository();
    sut = new GetDashboardQuickActionsUseCase(
      financeEntriesRepository,
      bankReconciliationsRepository,
    );
  });

  it('should return empty actions when no pending items exist', async () => {
    const response = await sut.execute({ tenantId: TENANT_ID });

    expect(response.actions).toHaveLength(0);
    expect(response.summary.overdueCount).toBe(0);
    expect(response.summary.upcomingCount).toBe(0);
    expect(response.summary.pendingApprovalCount).toBe(0);
    expect(response.summary.unreconciledCount).toBe(0);
  });

  it('should return OVERDUE_PAYMENT action for overdue entries', async () => {
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAY-001',
      description: 'Overdue invoice',
      categoryId: new UniqueEntityID().toString(),
      expectedAmount: 2500,
      issueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      dueDate: pastDate,
      status: 'OVERDUE',
    });

    const response = await sut.execute({ tenantId: TENANT_ID });

    const overdueAction = response.actions.find(
      (a) => a.type === 'OVERDUE_PAYMENT',
    );
    expect(overdueAction).toBeDefined();
    expect(overdueAction!.urgency).toBe('HIGH');
    expect(response.summary.overdueCount).toBeGreaterThan(0);
  });

  it('should return UPCOMING_DUE action for entries due within 3 days', async () => {
    const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAY-002',
      description: 'Almost due invoice',
      categoryId: new UniqueEntityID().toString(),
      expectedAmount: 1800,
      issueDate: new Date(),
      dueDate: twoDaysFromNow,
      status: 'PENDING',
    });

    const response = await sut.execute({ tenantId: TENANT_ID });

    const upcomingAction = response.actions.find(
      (a) => a.type === 'UPCOMING_DUE',
    );
    expect(upcomingAction).toBeDefined();
    expect(upcomingAction!.urgency).toBe('MEDIUM');
    expect(response.summary.upcomingCount).toBeGreaterThan(0);
  });

  it('should return PENDING_APPROVAL action for scheduled entries', async () => {
    await financeEntriesRepository.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAY-003',
      description: 'Scheduled payment',
      categoryId: new UniqueEntityID().toString(),
      expectedAmount: 3000,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
    });

    const response = await sut.execute({ tenantId: TENANT_ID });

    const pendingAction = response.actions.find(
      (a) => a.type === 'PENDING_APPROVAL',
    );
    expect(pendingAction).toBeDefined();
    expect(pendingAction!.urgency).toBe('MEDIUM');
    expect(response.summary.pendingApprovalCount).toBeGreaterThan(0);
  });

  it('should return UNRECONCILED action for in-progress reconciliations', async () => {
    await bankReconciliationsRepository.create({
      tenantId: TENANT_ID,
      bankAccountId: new UniqueEntityID().toString(),
      fileName: 'extrato-jan.ofx',
      periodStart: new Date(2026, 0, 1),
      periodEnd: new Date(2026, 0, 31),
      totalTransactions: 50,
      status: 'IN_PROGRESS',
    });

    const response = await sut.execute({ tenantId: TENANT_ID });

    const unreconciledAction = response.actions.find(
      (a) => a.type === 'UNRECONCILED',
    );
    expect(unreconciledAction).toBeDefined();
    expect(unreconciledAction!.urgency).toBe('LOW');
    expect(response.summary.unreconciledCount).toBeGreaterThan(0);
  });
});
