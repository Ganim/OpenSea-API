import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { CheckDueDateCardsUseCase } from './check-due-date-cards';

let cardsRepository: InMemoryCardsRepository;
let notificationsRepository: InMemoryNotificationsRepository;
let sut: CheckDueDateCardsUseCase;

const boardId = 'board-1';
const columnId = 'column-1';
const tenantId = 'tenant-1';
const assigneeId = 'user-assignee';
const reporterId = 'user-reporter';

describe('CheckDueDateCardsUseCase', () => {
  beforeEach(() => {
    cardsRepository = new InMemoryCardsRepository();
    notificationsRepository = new InMemoryNotificationsRepository();
    sut = new CheckDueDateCardsUseCase(
      cardsRepository,
      notificationsRepository,
    );

    cardsRepository.boardTenantMap.set(boardId, tenantId);
  });

  it('should notify assignee and reporter when card is overdue', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa vencida',
      reporterId,
      assigneeId,
      dueDate: yesterday,
      status: 'IN_PROGRESS',
    });

    const result = await sut.execute();

    expect(result.processed).toBeGreaterThanOrEqual(1);
    expect(result.notified).toBe(2);

    const assigneeNotification = notificationsRepository.items.find(
      (n) => n.userId.toString() === assigneeId,
    );
    expect(assigneeNotification).toBeDefined();
    expect(assigneeNotification!.title).toBe('Cartão vencido');
    expect(assigneeNotification!.message).toContain('Tarefa vencida');
    expect(assigneeNotification!.type).toBe('WARNING');
    expect(assigneeNotification!.channel).toBe('IN_APP');
    expect(assigneeNotification!.entityType).toBe('card');

    const reporterNotification = notificationsRepository.items.find(
      (n) => n.userId.toString() === reporterId,
    );
    expect(reporterNotification).toBeDefined();
  });

  it('should notify only reporter when card has no assignee', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa sem responsável',
      reporterId,
      assigneeId: null,
      dueDate: yesterday,
      status: 'OPEN',
    });

    const result = await sut.execute();

    expect(result.notified).toBe(1);
    expect(notificationsRepository.items[0].userId.toString()).toBe(reporterId);
  });

  it('should not notify for DONE cards', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa concluída',
      reporterId,
      assigneeId,
      dueDate: yesterday,
      status: 'DONE',
    });

    const result = await sut.execute();

    expect(result.processed).toBe(0);
    expect(result.notified).toBe(0);
  });

  it('should not notify for CANCELED cards', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa cancelada',
      reporterId,
      assigneeId,
      dueDate: yesterday,
      status: 'CANCELED',
    });

    const result = await sut.execute();

    expect(result.processed).toBe(0);
    expect(result.notified).toBe(0);
  });

  it('should not notify for deleted cards', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const card = await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa excluída',
      reporterId,
      assigneeId,
      dueDate: yesterday,
      status: 'IN_PROGRESS',
    });

    await cardsRepository.softDelete(card.id.toString(), boardId);

    const result = await sut.execute();

    expect(result.processed).toBe(0);
    expect(result.notified).toBe(0);
  });

  it('should not notify for archived cards', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const card = await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa arquivada',
      reporterId,
      assigneeId,
      dueDate: yesterday,
      status: 'IN_PROGRESS',
    });

    card.archive();

    const result = await sut.execute();

    expect(result.processed).toBe(0);
    expect(result.notified).toBe(0);
  });

  it('should not duplicate notifications for already notified cards', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa já notificada',
      reporterId,
      assigneeId: null,
      dueDate: yesterday,
      status: 'OPEN',
    });

    // First run
    await sut.execute();
    const firstRunCount = notificationsRepository.items.length;

    // Second run - should not create duplicates for the same level
    const result = await sut.execute();

    expect(result.notified).toBe(0);
    expect(notificationsRepository.items).toHaveLength(firstRunCount);
  });

  it('should not notify for cards without dueDate', async () => {
    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa sem data',
      reporterId,
      assigneeId,
      dueDate: null,
      status: 'OPEN',
    });

    const result = await sut.execute();

    expect(result.processed).toBe(0);
    expect(result.notified).toBe(0);
  });

  it('should not notify for cards with dueDate far in the future', async () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa futura',
      reporterId,
      assigneeId,
      dueDate: nextWeek,
      status: 'OPEN',
    });

    const result = await sut.execute();

    expect(result.processed).toBe(0);
    expect(result.notified).toBe(0);
  });

  it('should deduplicate when assignee is also the reporter', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa própria',
      reporterId: assigneeId,
      assigneeId,
      dueDate: yesterday,
      status: 'OPEN',
    });

    const result = await sut.execute();

    expect(result.notified).toBe(1);
  });

  // ─── New: approaching due date tests ───

  it('should send DUE_24H notification for card due in 12 hours', async () => {
    const in12Hours = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa em 12h',
      reporterId,
      assigneeId: null,
      dueDate: in12Hours,
      status: 'IN_PROGRESS',
    });

    const result = await sut.execute();

    expect(result.notified).toBe(1);
    const notification = notificationsRepository.items[0];
    expect(notification.title).toBe('Cartão vence em breve');
    expect(notification.message).toContain('24 horas');
    expect(notification.type).toBe('INFO');
    expect(notification.priority).toBe('NORMAL');
  });

  it('should send DUE_1H notification for card due in 30 minutes', async () => {
    const in30Min = new Date(Date.now() + 30 * 60 * 1000);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa em 30min',
      reporterId,
      assigneeId: null,
      dueDate: in30Min,
      status: 'IN_PROGRESS',
    });

    const result = await sut.execute();

    expect(result.notified).toBe(1);
    const notification = notificationsRepository.items[0];
    expect(notification.title).toBe('Cartão vence em 1 hora');
    expect(notification.message).toContain('1 hora');
    expect(notification.type).toBe('WARNING');
    expect(notification.priority).toBe('HIGH');
  });

  it('should send separate notifications for different time windows', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const in30Min = new Date(Date.now() + 30 * 60 * 1000);
    const in12Hours = new Date(Date.now() + 12 * 60 * 60 * 1000);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Vencida',
      reporterId,
      assigneeId: null,
      dueDate: yesterday,
      status: 'OPEN',
    });

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Em 30min',
      reporterId,
      assigneeId: null,
      dueDate: in30Min,
      status: 'IN_PROGRESS',
    });

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Em 12h',
      reporterId,
      assigneeId: null,
      dueDate: in12Hours,
      status: 'IN_PROGRESS',
    });

    const result = await sut.execute();

    expect(result.processed).toBe(3);
    expect(result.notified).toBe(3);

    const titles = notificationsRepository.items.map((n) => n.title);
    expect(titles).toContain('Cartão vencido');
    expect(titles).toContain('Cartão vence em 1 hora');
    expect(titles).toContain('Cartão vence em breve');
  });

  it('should use different entityIds per level to allow multiple notifications per card', async () => {
    const in30Min = new Date(Date.now() + 30 * 60 * 1000);

    const card = await cardsRepository.create({
      boardId,
      columnId,
      title: 'Multi-notify',
      reporterId,
      assigneeId: null,
      dueDate: in30Min,
      status: 'IN_PROGRESS',
    });

    await sut.execute();

    const notification = notificationsRepository.items[0];
    expect(notification.entityId).toBe(`${card.id.toString()}:DUE_1H`);
  });
});
