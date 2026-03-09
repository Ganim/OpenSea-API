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

    expect(result.processed).toBe(1);
    expect(result.notified).toBe(2);
    expect(notificationsRepository.items).toHaveLength(2);

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

    expect(result.processed).toBe(1);
    expect(result.notified).toBe(1);
    expect(notificationsRepository.items).toHaveLength(1);
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
    expect(notificationsRepository.items).toHaveLength(0);
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
    expect(notificationsRepository.items).toHaveLength(0);
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
    expect(notificationsRepository.items).toHaveLength(0);
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
    expect(notificationsRepository.items).toHaveLength(0);
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
    expect(notificationsRepository.items).toHaveLength(1);

    // Second run - should not create duplicates
    const result = await sut.execute();

    expect(result.processed).toBe(1);
    expect(result.notified).toBe(0);
    expect(notificationsRepository.items).toHaveLength(1);
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

  it('should not notify for cards with future dueDate', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await cardsRepository.create({
      boardId,
      columnId,
      title: 'Tarefa futura',
      reporterId,
      assigneeId,
      dueDate: tomorrow,
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

    expect(result.processed).toBe(1);
    expect(result.notified).toBe(1);
    expect(notificationsRepository.items).toHaveLength(1);
  });
});
