import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryModuleNotifier } from '@/use-cases/shared/helpers/module-notifier';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  CheckOverdueEntriesUseCase,
  type FinanceEntryNotificationCategory,
} from './check-overdue-entries';

let entriesRepository: InMemoryFinanceEntriesRepository;
let notifier: InMemoryModuleNotifier<FinanceEntryNotificationCategory>;
let sut: CheckOverdueEntriesUseCase;

const tenantId = 'tenant-1';
const userId = 'user-1';
const categoryId = new UniqueEntityID().toString();
const costCenterId = new UniqueEntityID().toString();

function daysAgo(days: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days),
  );
}

function daysFromNow(days: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days),
  );
}

describe('CheckOverdueEntriesUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    notifier = new InMemoryModuleNotifier();
    sut = new CheckOverdueEntriesUseCase(entriesRepository, notifier);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 10, 12, 0, 0));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should mark PENDING payable entries as OVERDUE', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel Janeiro',
      categoryId,
      costCenterId,
      expectedAmount: 1500,
      issueDate: daysAgo(30),
      dueDate: daysAgo(5),
    });

    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.markedOverdue).toBe(1);
    expect(result.payableOverdue).toBe(1);
    expect(result.receivableOverdue).toBe(0);
    expect(entriesRepository.items[0].status).toBe('OVERDUE');
  });

  it('should mark PENDING receivable entries as OVERDUE', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Fatura Cliente A',
      categoryId,
      costCenterId,
      expectedAmount: 3000,
      customerName: 'Cliente A',
      issueDate: daysAgo(30),
      dueDate: daysAgo(10),
    });

    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.markedOverdue).toBe(1);
    expect(result.receivableOverdue).toBe(1);
    expect(result.payableOverdue).toBe(0);
    expect(entriesRepository.items[0].status).toBe('OVERDUE');
  });

  it('should dispatch finance.entry_overdue for payable overdue entries', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Energia',
      categoryId,
      costCenterId,
      expectedAmount: 500.5,
      issueDate: daysAgo(15),
      dueDate: daysAgo(2),
    });

    await sut.execute({ tenantId, createdBy: userId });

    expect(notifier.dispatches).toHaveLength(1);
    const dispatched = notifier.dispatches[0];
    expect(dispatched.category).toBe('finance.entry_overdue');
    expect(dispatched.title).toBe('Despesa atrasada');
    expect(dispatched.body).toContain('Energia');
    expect(dispatched.body).toContain('R$ 500.50');
    expect(dispatched.priority).toBe('HIGH');
    expect(dispatched.entityType).toBe('finance_entry');
  });

  it('should dispatch finance.entry_overdue for receivable overdue with customerName', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda mensal',
      categoryId,
      costCenterId,
      expectedAmount: 2000,
      customerName: 'João Silva',
      issueDate: daysAgo(20),
      dueDate: daysAgo(3),
    });

    await sut.execute({ tenantId, createdBy: userId });

    const dispatched = notifier.dispatches[0];
    expect(dispatched.category).toBe('finance.entry_overdue');
    expect(dispatched.title).toBe('Recebimento atrasado');
    expect(dispatched.body).toContain('João Silva');
    expect(dispatched.body).toContain('R$ 2000.00');
  });

  it('should dispatch finance.entry_due_3d for entries due within 3 days', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Internet',
      categoryId,
      costCenterId,
      expectedAmount: 200,
      issueDate: daysAgo(5),
      dueDate: daysFromNow(2),
    });

    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Mensalidade',
      categoryId,
      costCenterId,
      expectedAmount: 800,
      customerName: 'Maria',
      issueDate: daysAgo(10),
      dueDate: daysFromNow(1),
    });

    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.dueSoonAlerts).toBe(2);
    expect(result.markedOverdue).toBe(0);
    expect(notifier.dispatches).toHaveLength(2);
    expect(
      notifier.dispatches.every((d) => d.category === 'finance.entry_due_3d'),
    ).toBe(true);

    const payable = notifier.dispatches.find((d) =>
      d.body.includes('Internet'),
    );
    expect(payable!.title).toBe('Despesa próxima do vencimento');
    expect(payable!.body).toContain('2 dias');
    expect(payable!.priority).toBe('NORMAL');

    const receivable = notifier.dispatches.find((d) =>
      d.body.includes('Mensalidade'),
    );
    expect(receivable!.title).toBe('Recebimento próximo do vencimento');
    expect(receivable!.body).toContain('Maria');
  });

  it('should not mark already PAID/RECEIVED/CANCELLED entries as overdue', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Pago',
      categoryId,
      costCenterId,
      expectedAmount: 100,
      issueDate: daysAgo(30),
      dueDate: daysAgo(5),
      status: 'PAID',
    });

    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Recebido',
      categoryId,
      costCenterId,
      expectedAmount: 200,
      issueDate: daysAgo(30),
      dueDate: daysAgo(5),
      status: 'RECEIVED',
    });

    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.markedOverdue).toBe(0);
    expect(notifier.dispatches).toHaveLength(0);
  });

  it('should handle mixed overdue and due-soon entries', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Atrasada',
      categoryId,
      costCenterId,
      expectedAmount: 1000,
      issueDate: daysAgo(30),
      dueDate: daysAgo(7),
    });

    await entriesRepository.create({
      tenantId,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Próxima',
      categoryId,
      costCenterId,
      expectedAmount: 500,
      customerName: 'Carlos',
      issueDate: daysAgo(5),
      dueDate: daysFromNow(2),
    });

    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Futura',
      categoryId,
      costCenterId,
      expectedAmount: 300,
      issueDate: daysAgo(1),
      dueDate: daysFromNow(30),
    });

    const result = await sut.execute({ tenantId, createdBy: userId });

    expect(result.markedOverdue).toBe(1);
    expect(result.payableOverdue).toBe(1);
    expect(result.dueSoonAlerts).toBe(1);
    expect(notifier.dispatches).toHaveLength(2);
  });

  it('should not dispatch notifications when no createdBy is provided', async () => {
    await entriesRepository.create({
      tenantId,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Sem responsável',
      categoryId,
      costCenterId,
      expectedAmount: 500,
      issueDate: daysAgo(10),
      dueDate: daysAgo(3),
    });

    const result = await sut.execute({ tenantId });

    expect(result.markedOverdue).toBe(1);
    expect(notifier.dispatches).toHaveLength(0);
  });
});
