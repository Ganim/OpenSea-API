import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryModuleNotifier } from '@/use-cases/shared/helpers/module-notifier';
import {
  CheckDueDateCardsUseCase,
  type TaskDueDateNotificationCategory,
} from './check-due-date-cards';

let cardsRepository: InMemoryCardsRepository;
let notifier: InMemoryModuleNotifier<TaskDueDateNotificationCategory>;
let sut: CheckDueDateCardsUseCase;

const boardId = 'board-1';
const columnId = 'column-1';
const tenantId = 'tenant-1';
const assigneeId = 'user-assignee';
const reporterId = 'user-reporter';

describe('CheckDueDateCardsUseCase', () => {
  beforeEach(() => {
    cardsRepository = new InMemoryCardsRepository();
    notifier = new InMemoryModuleNotifier();
    sut = new CheckDueDateCardsUseCase(cardsRepository, notifier);

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

    const result = await sut.execute({ tenantId });

    expect(result.processed).toBeGreaterThanOrEqual(1);
    expect(result.notified).toBe(2);

    const assigneeDispatch = notifier.dispatches.find(
      (d) => d.recipientUserId === assigneeId,
    );
    expect(assigneeDispatch).toBeDefined();
    expect(assigneeDispatch!.category).toBe('tasks.overdue');
    expect(assigneeDispatch!.title).toBe('Cartão vencido');
    expect(assigneeDispatch!.body).toContain('Tarefa vencida');
    expect(assigneeDispatch!.priority).toBe('HIGH');
    expect(assigneeDispatch!.entityType).toBe('card');

    const reporterDispatch = notifier.dispatches.find(
      (d) => d.recipientUserId === reporterId,
    );
    expect(reporterDispatch).toBeDefined();
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

    const result = await sut.execute({ tenantId });

    expect(result.notified).toBe(1);
    expect(notifier.dispatches[0].recipientUserId).toBe(reporterId);
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

    const result = await sut.execute({ tenantId });

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

    const result = await sut.execute({ tenantId });

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

    const result = await sut.execute({ tenantId });

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

    const result = await sut.execute({ tenantId });

    expect(result.processed).toBe(0);
    expect(result.notified).toBe(0);
  });

  it('should dispatch on every run (dispatcher idempotency handles dedupe via idempotencyKey)', async () => {
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

    await sut.execute({ tenantId });
    const result = await sut.execute({ tenantId });

    // The use-case now delegates idempotency to the dispatcher (via
    // dedupeSuffix in the idempotencyKey), so it always emits — the notifier
    // receives two dispatches with the SAME idempotencyKey and the dispatcher
    // deduplicates downstream.
    expect(result.notified).toBe(1);
    expect(notifier.dispatches).toHaveLength(2);
    expect(notifier.dispatches[0].dedupeSuffix).toBe(
      notifier.dispatches[1].dedupeSuffix,
    );
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

    const result = await sut.execute({ tenantId });

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

    const result = await sut.execute({ tenantId });

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

    const result = await sut.execute({ tenantId });

    expect(result.notified).toBe(1);
  });

  it('should dispatch tasks.due_soon for card due in 12 hours', async () => {
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

    const result = await sut.execute({ tenantId });

    expect(result.notified).toBe(1);
    const dispatched = notifier.dispatches[0];
    expect(dispatched.category).toBe('tasks.due_soon');
    expect(dispatched.title).toBe('Cartão vence em breve');
    expect(dispatched.body).toContain('24 horas');
    expect(dispatched.priority).toBe('NORMAL');
  });

  it('should dispatch tasks.due_today for card due in 30 minutes', async () => {
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

    const result = await sut.execute({ tenantId });

    expect(result.notified).toBe(1);
    const dispatched = notifier.dispatches[0];
    expect(dispatched.category).toBe('tasks.due_today');
    expect(dispatched.title).toBe('Cartão vence em 1 hora');
    expect(dispatched.body).toContain('1 hora');
    expect(dispatched.priority).toBe('HIGH');
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

    const result = await sut.execute({ tenantId });

    expect(result.processed).toBe(3);
    expect(result.notified).toBe(3);

    const categories = notifier.dispatches.map((d) => d.category);
    expect(categories).toContain('tasks.overdue');
    expect(categories).toContain('tasks.due_today');
    expect(categories).toContain('tasks.due_soon');
  });
});
