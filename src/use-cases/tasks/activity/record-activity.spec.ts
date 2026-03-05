import { describe, it, expect, beforeEach } from 'vitest';
import { RecordActivityUseCase } from './record-activity';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: RecordActivityUseCase;

describe('RecordActivityUseCase', () => {
  beforeEach(() => {
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new RecordActivityUseCase(cardActivitiesRepository);
  });

  it('should record an activity', async () => {
    const { activity } = await sut.execute({
      cardId: 'card-1',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'CREATED',
      description: 'João criou o cartão Test Card',
    });

    expect(activity.cardId).toBe('card-1');
    expect(activity.boardId).toBe('board-1');
    expect(activity.userId).toBe('user-1');
    expect(activity.type).toBe('CREATED');
    expect(activity.description).toBe('João criou o cartão Test Card');
    expect(activity.createdAt).toBeInstanceOf(Date);
  });

  it('should record an activity with field change details', async () => {
    const { activity } = await sut.execute({
      cardId: 'card-1',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'FIELD_CHANGED',
      description: 'João alterou o status do cartão',
      field: 'status',
      oldValue: 'OPEN',
      newValue: 'IN_PROGRESS',
    });

    expect(activity.field).toBe('status');
    expect(activity.oldValue).toBe('OPEN');
    expect(activity.newValue).toBe('IN_PROGRESS');
  });

  it('should record an activity with metadata', async () => {
    const { activity } = await sut.execute({
      cardId: 'card-1',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'MOVED',
      description: 'João moveu o cartão para Concluído',
      metadata: { fromColumn: 'col-1', toColumn: 'col-2' },
    });

    expect(activity.metadata).toEqual({
      fromColumn: 'col-1',
      toColumn: 'col-2',
    });
  });

  it('should set default null values for optional fields', async () => {
    const { activity } = await sut.execute({
      cardId: 'card-1',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'COMMENT_ADDED',
      description: 'João comentou no cartão',
    });

    expect(activity.field).toBeNull();
    expect(activity.oldValue).toBeNull();
    expect(activity.newValue).toBeNull();
    expect(activity.metadata).toBeNull();
  });
});
