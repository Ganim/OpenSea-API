import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));
import {
  ExecuteAutomationUseCase,
  type TaskAutomationNotificationCategory,
} from './execute-automation';
import { InMemoryBoardAutomationsRepository } from '@/repositories/tasks/in-memory/in-memory-board-automations-repository';
import { InMemoryBoardColumnsRepository } from '@/repositories/tasks/in-memory/in-memory-board-columns-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';
import { InMemoryCardWatchersRepository } from '@/repositories/tasks/in-memory/in-memory-card-watchers-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryModuleNotifier } from '@/use-cases/shared/helpers/module-notifier';

let boardAutomationsRepository: InMemoryBoardAutomationsRepository;
let cardsRepository: InMemoryCardsRepository;
let boardColumnsRepository: InMemoryBoardColumnsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let cardWatchersRepository: InMemoryCardWatchersRepository;
let notifier: InMemoryModuleNotifier<TaskAutomationNotificationCategory>;
let sut: ExecuteAutomationUseCase;

const BOARD_ID = 'board-1';
const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

describe('ExecuteAutomationUseCase', () => {
  beforeEach(async () => {
    boardAutomationsRepository = new InMemoryBoardAutomationsRepository();
    cardsRepository = new InMemoryCardsRepository();
    boardColumnsRepository = new InMemoryBoardColumnsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    cardWatchersRepository = new InMemoryCardWatchersRepository();
    notifier = new InMemoryModuleNotifier();
    sut = new ExecuteAutomationUseCase(
      boardAutomationsRepository,
      cardsRepository,
      boardColumnsRepository,
      cardActivitiesRepository,
      cardWatchersRepository,
      notifier,
    );

    await boardColumnsRepository.create({
      boardId: BOARD_ID,
      title: 'A Fazer',
      position: 0,
      isDefault: true,
    });

    await boardColumnsRepository.create({
      boardId: BOARD_ID,
      title: 'Concluido',
      position: 1,
    });

    await boardColumnsRepository.create({
      boardId: BOARD_ID,
      title: 'Finalizado',
      position: 2,
      isDone: true,
    });
  });

  async function createTestCard(overrides?: {
    columnId?: string;
    title?: string;
  }) {
    const defaultColumnId = boardColumnsRepository.items[0].id;
    const card = await cardsRepository.create({
      boardId: BOARD_ID,
      columnId: overrides?.columnId ?? defaultColumnId,
      title: overrides?.title ?? 'Test Card',
      reporterId: USER_ID,
    });
    return card;
  }

  it('should execute MOVE_CARD action when CARD_MOVED trigger matches', async () => {
    const fromColumn = boardColumnsRepository.items[0];
    const toColumn = boardColumnsRepository.items[1];
    const doneColumn = boardColumnsRepository.items[2];

    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Move to Done on review',
      trigger: 'CARD_MOVED',
      triggerConfig: { toColumnId: toColumn.id },
      action: 'MOVE_CARD',
      actionConfig: { columnId: doneColumn.id },
      createdBy: USER_ID,
    });

    const card = await createTestCard({ columnId: fromColumn.id });
    const cardId = card.id.toString();

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_MOVED',
      context: {
        cardId,
        userId: USER_ID,
        fromColumnId: fromColumn.id,
        toColumnId: toColumn.id,
      },
    });

    expect(executedCount).toBe(1);

    const updatedCard = await cardsRepository.findById(cardId, BOARD_ID);
    expect(updatedCard?.columnId.toString()).toBe(doneColumn.id);
  });

  it('should execute COMPLETE_CARD action when ALL_SUBTASKS_DONE trigger fires', async () => {
    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Auto-complete when all subtasks done',
      trigger: 'ALL_SUBTASKS_DONE',
      triggerConfig: {},
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: USER_ID,
    });

    const card = await createTestCard();
    const cardId = card.id.toString();

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'ALL_SUBTASKS_DONE',
      context: {
        cardId,
        userId: USER_ID,
      },
    });

    expect(executedCount).toBe(1);

    const updatedCard = await cardsRepository.findById(cardId, BOARD_ID);
    expect(updatedCard?.status).toBe('DONE');
    expect(updatedCard?.completedAt).toBeTruthy();
  });

  it('should skip inactive automations', async () => {
    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Disabled automation',
      isActive: false,
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: USER_ID,
    });

    const card = await createTestCard();

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_CREATED',
      context: {
        cardId: card.id.toString(),
        userId: USER_ID,
      },
    });

    expect(executedCount).toBe(0);

    const unchangedCard = await cardsRepository.findById(
      card.id.toString(),
      BOARD_ID,
    );
    expect(unchangedCard?.status).toBe('OPEN');
  });

  it('should execute multiple matching automations for the same trigger', async () => {
    const doneColumn = boardColumnsRepository.items[2];

    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Assign user on creation',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'ASSIGN_USER',
      actionConfig: { userId: 'user-2' },
      createdBy: USER_ID,
    });

    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Move to done on creation',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'MOVE_CARD',
      actionConfig: { columnId: doneColumn.id },
      createdBy: USER_ID,
    });

    const card = await createTestCard();
    const cardId = card.id.toString();

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_CREATED',
      context: {
        cardId,
        userId: USER_ID,
      },
    });

    expect(executedCount).toBe(2);

    const updatedCard = await cardsRepository.findById(cardId, BOARD_ID);
    expect(updatedCard?.assigneeId?.toString()).toBe('user-2');
    expect(updatedCard?.columnId.toString()).toBe(doneColumn.id);
  });

  it('should record AUTOMATION_TRIGGERED activity for each executed automation', async () => {
    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Auto-complete',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: USER_ID,
    });

    const card = await createTestCard();

    await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_CREATED',
      context: {
        cardId: card.id.toString(),
        userId: USER_ID,
      },
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);

    const activity = cardActivitiesRepository.items[0];
    expect(activity.type).toBe('AUTOMATION_TRIGGERED');
    expect(activity.cardId).toBe(card.id.toString());
    expect(activity.boardId).toBe(BOARD_ID);
    expect(activity.metadata).toMatchObject({
      automationName: 'Auto-complete',
      trigger: 'CARD_CREATED',
      action: 'COMPLETE_CARD',
    });
  });

  it('should not match CARD_MOVED when toColumnId does not match triggerConfig', async () => {
    const fromColumn = boardColumnsRepository.items[0];
    const toColumn = boardColumnsRepository.items[1];

    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Only on done column',
      trigger: 'CARD_MOVED',
      triggerConfig: { toColumnId: 'some-other-column-id' },
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: USER_ID,
    });

    const card = await createTestCard({ columnId: fromColumn.id });

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_MOVED',
      context: {
        cardId: card.id.toString(),
        userId: USER_ID,
        fromColumnId: fromColumn.id,
        toColumnId: toColumn.id,
      },
    });

    expect(executedCount).toBe(0);
  });

  it('should match FIELD_CHANGED only when fieldName matches triggerConfig', async () => {
    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'On priority change',
      trigger: 'FIELD_CHANGED',
      triggerConfig: { fieldName: 'priority' },
      action: 'ASSIGN_USER',
      actionConfig: { userId: 'user-3' },
      createdBy: USER_ID,
    });

    const card = await createTestCard();
    const cardId = card.id.toString();

    // Should NOT match - different field name
    const { executedCount: noMatchCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'FIELD_CHANGED',
      context: {
        cardId,
        userId: USER_ID,
        fieldName: 'status',
      },
    });

    expect(noMatchCount).toBe(0);

    // Should match - correct field name
    const { executedCount: matchCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'FIELD_CHANGED',
      context: {
        cardId,
        userId: USER_ID,
        fieldName: 'priority',
      },
    });

    expect(matchCount).toBe(1);

    const updatedCard = await cardsRepository.findById(cardId, BOARD_ID);
    expect(updatedCard?.assigneeId?.toString()).toBe('user-3');
  });

  it('should handle errors gracefully and continue executing remaining automations', async () => {
    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Move to nonexistent column',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'MOVE_CARD',
      actionConfig: { columnId: 'nonexistent-column' },
      createdBy: USER_ID,
    });

    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Complete card',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: USER_ID,
    });

    const card = await createTestCard();

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_CREATED',
      context: {
        cardId: card.id.toString(),
        userId: USER_ID,
      },
    });

    // First automation returns null (column not found) so no activity recorded
    // Second automation should still succeed
    expect(executedCount).toBe(1);

    const updatedCard = await cardsRepository.findById(
      card.id.toString(),
      BOARD_ID,
    );
    expect(updatedCard?.status).toBe('DONE');
  });

  it('should return zero when no automations exist for the trigger', async () => {
    const card = await createTestCard();

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'DUE_DATE_REACHED',
      context: {
        cardId: card.id.toString(),
        userId: USER_ID,
      },
    });

    expect(executedCount).toBe(0);
  });

  it('should skip automation when card does not exist', async () => {
    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Complete on creation',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'COMPLETE_CARD',
      actionConfig: {},
      createdBy: USER_ID,
    });

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_CREATED',
      context: {
        cardId: 'nonexistent-card',
        userId: USER_ID,
      },
    });

    expect(executedCount).toBe(0);
    expect(cardActivitiesRepository.items).toHaveLength(0);
  });

  it('should execute ADD_LABEL action correctly', async () => {
    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Add urgent label',
      trigger: 'DUE_DATE_REACHED',
      triggerConfig: {},
      action: 'ADD_LABEL',
      actionConfig: { labelId: 'label-urgent' },
      createdBy: USER_ID,
    });

    const card = await createTestCard();
    const cardId = card.id.toString();

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'DUE_DATE_REACHED',
      context: {
        cardId,
        userId: USER_ID,
      },
    });

    expect(executedCount).toBe(1);

    const cardWithLabels = await cardsRepository.findByIdWithLabels(
      cardId,
      BOARD_ID,
    );
    expect(cardWithLabels?.labelIds).toContain('label-urgent');
  });

  it('should not duplicate label if already assigned via ADD_LABEL', async () => {
    const card = await cardsRepository.create({
      boardId: BOARD_ID,
      columnId: boardColumnsRepository.items[0].id,
      title: 'Card with label',
      reporterId: USER_ID,
      labelIds: ['label-urgent'],
    });
    const cardId = card.id.toString();

    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Add urgent label again',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'ADD_LABEL',
      actionConfig: { labelId: 'label-urgent' },
      createdBy: USER_ID,
    });

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_CREATED',
      context: {
        cardId,
        userId: USER_ID,
      },
    });

    // ADD_LABEL returns null when label already exists -> no activity recorded
    expect(executedCount).toBe(0);

    const cardWithLabels = await cardsRepository.findByIdWithLabels(
      cardId,
      BOARD_ID,
    );
    expect(cardWithLabels?.labelIds).toEqual(['label-urgent']);
  });

  it('should execute SEND_NOTIFICATION action to card watchers', async () => {
    const card = await createTestCard({ title: 'Important Task' });
    const cardId = card.id.toString();

    await cardWatchersRepository.create({
      cardId,
      userId: 'watcher-1',
      boardId: BOARD_ID,
    });

    await cardWatchersRepository.create({
      cardId,
      userId: 'watcher-2',
      boardId: BOARD_ID,
    });

    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Notify watchers on creation',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'SEND_NOTIFICATION',
      actionConfig: { message: 'Cartão foi criado' },
      createdBy: USER_ID,
    });

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_CREATED',
      context: {
        cardId,
        userId: USER_ID,
      },
    });

    expect(executedCount).toBe(1);
    expect(notifier.dispatches).toHaveLength(2);
    expect(notifier.dispatches[0].body).toBe('Cartão foi criado');
    expect(notifier.dispatches[0].title).toBe('Notificação: Important Task');
    expect(notifier.dispatches[0].category).toBe('tasks.mentioned');
  });

  it('should not send notification to the actor (userId)', async () => {
    const card = await createTestCard();
    const cardId = card.id.toString();

    await cardWatchersRepository.create({
      cardId,
      userId: USER_ID,
      boardId: BOARD_ID,
    });

    await cardWatchersRepository.create({
      cardId,
      userId: 'other-user',
      boardId: BOARD_ID,
    });

    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Notify watchers',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'SEND_NOTIFICATION',
      actionConfig: {},
      createdBy: USER_ID,
    });

    await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_CREATED',
      context: {
        cardId,
        userId: USER_ID,
      },
    });

    expect(notifier.dispatches).toHaveLength(1);
    expect(notifier.dispatches[0].recipientUserId).toBe('other-user');
  });

  it('should return null for SEND_NOTIFICATION when no watchers exist', async () => {
    const card = await createTestCard();
    const cardId = card.id.toString();

    await boardAutomationsRepository.create({
      boardId: BOARD_ID,
      name: 'Notify nobody',
      trigger: 'CARD_CREATED',
      triggerConfig: {},
      action: 'SEND_NOTIFICATION',
      actionConfig: {},
      createdBy: USER_ID,
    });

    const { executedCount } = await sut.execute({
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      trigger: 'CARD_CREATED',
      context: {
        cardId,
        userId: USER_ID,
      },
    });

    expect(executedCount).toBe(0);
    expect(notifier.dispatches).toHaveLength(0);
  });
});
