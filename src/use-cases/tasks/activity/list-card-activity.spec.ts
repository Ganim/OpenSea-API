import { describe, it, expect, beforeEach } from 'vitest';
import { ListCardActivityUseCase } from './list-card-activity';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: ListCardActivityUseCase;

describe('ListCardActivityUseCase', () => {
  beforeEach(async () => {
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new ListCardActivityUseCase(cardActivitiesRepository);

    await cardActivitiesRepository.create({
      cardId: 'card-1',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'CREATED',
      description: 'Cartão criado',
    });

    await cardActivitiesRepository.create({
      cardId: 'card-1',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'FIELD_CHANGED',
      description: 'Status alterado',
    });

    await cardActivitiesRepository.create({
      cardId: 'card-1',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'COMMENT_ADDED',
      description: 'Comentário adicionado',
    });

    await cardActivitiesRepository.create({
      cardId: 'card-2',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'CREATED',
      description: 'Outro cartão criado',
    });
  });

  it('should list activities for a card', async () => {
    const { activities, total } = await sut.execute({ cardId: 'card-1' });

    expect(activities).toHaveLength(3);
    expect(total).toBe(3);
  });

  it('should filter activities by type', async () => {
    const { activities, total } = await sut.execute({
      cardId: 'card-1',
      type: 'FIELD_CHANGED',
    });

    expect(activities).toHaveLength(1);
    expect(total).toBe(1);
    expect(activities[0].type).toBe('FIELD_CHANGED');
  });

  it('should paginate activities', async () => {
    const { activities, total } = await sut.execute({
      cardId: 'card-1',
      page: 1,
      limit: 2,
    });

    expect(activities).toHaveLength(2);
    expect(total).toBe(3);

    const { activities: secondPage } = await sut.execute({
      cardId: 'card-1',
      page: 2,
      limit: 2,
    });

    expect(secondPage).toHaveLength(1);
  });

  it('should return newest activities first', async () => {
    const { activities } = await sut.execute({ cardId: 'card-1' });

    for (let i = 0; i < activities.length - 1; i++) {
      expect(activities[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        activities[i + 1].createdAt.getTime(),
      );
    }
  });

  it('should not include activities from other cards', async () => {
    const { activities } = await sut.execute({ cardId: 'card-1' });

    for (const activity of activities) {
      expect(activity.cardId).toBe('card-1');
    }
  });
});
