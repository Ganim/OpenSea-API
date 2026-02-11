import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckOverdueEntriesUseCase } from './check-overdue-entries';

let entriesRepository: InMemoryFinanceEntriesRepository;
let notificationsRepository: InMemoryNotificationsRepository;
let sut: CheckOverdueEntriesUseCase;

const tenantId = 'tenant-1';
const userId = 'user-1';
const categoryId = new UniqueEntityID().toString();
const costCenterId = new UniqueEntityID().toString();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

describe('CheckOverdueEntriesUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    notificationsRepository = new InMemoryNotificationsRepository();
    sut = new CheckOverdueEntriesUseCase(
      entriesRepository,
      notificationsRepository,
    );
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 10, 12, 0, 0)); // Feb 10, 2026 noon
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

  it('should create PAYABLE_OVERDUE notification with correct data', async () => {
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

    expect(notificationsRepository.items).toHaveLength(1);
    const notif = notificationsRepository.items[0];
    expect(notif.title).toBe('Despesa atrasada');
    expect(notif.message).toContain('Energia');
    expect(notif.message).toContain('R$ 500.50');
    expect(notif.type).toBe('WARNING');
    expect(notif.priority).toBe('HIGH');
    expect(notif.entityType).toBe('finance_entry');
  });

  it('should create RECEIVABLE_OVERDUE notification with customerName', async () => {
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

    const notif = notificationsRepository.items[0];
    expect(notif.title).toBe('Recebimento atrasado');
    expect(notif.message).toContain('João Silva');
    expect(notif.message).toContain('R$ 2000.00');
  });

  it('should create DUE_SOON notifications for entries due within 3 days', async () => {
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
    expect(notificationsRepository.items).toHaveLength(2);

    const payableNotif = notificationsRepository.items.find((n) =>
      n.message.includes('Internet'),
    );
    expect(payableNotif!.title).toBe('Despesa próxima do vencimento');
    expect(payableNotif!.message).toContain('2 dias');
    expect(payableNotif!.type).toBe('REMINDER');

    const receivableNotif = notificationsRepository.items.find((n) =>
      n.message.includes('Mensalidade'),
    );
    expect(receivableNotif!.title).toBe('Recebimento próximo do vencimento');
    expect(receivableNotif!.message).toContain('Maria');
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
    expect(notificationsRepository.items).toHaveLength(0);
  });

  it('should handle mixed overdue and due-soon entries', async () => {
    // Overdue payable
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

    // Due soon receivable
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

    // Far future - should not trigger anything
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
    expect(notificationsRepository.items).toHaveLength(2);
  });

  it('should not create notifications when no createdBy is provided', async () => {
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
    expect(notificationsRepository.items).toHaveLength(0);
  });
});
