import { describe, it, expect, beforeEach } from 'vitest';
import { ListBoardActivityUseCase } from './list-board-activity';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: ListBoardActivityUseCase;

describe('ListBoardActivityUseCase', () => {
  beforeEach(async () => {
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new ListBoardActivityUseCase(cardActivitiesRepository);

    await cardActivitiesRepository.create({
      cardId: 'card-1',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'CREATED',
      description: 'Cartão 1 criado',
    });

    await cardActivitiesRepository.create({
      cardId: 'card-2',
      boardId: 'board-1',
      userId: 'user-2',
      type: 'FIELD_CHANGED',
      description: 'Status alterado',
    });

    await cardActivitiesRepository.create({
      cardId: 'card-3',
      boardId: 'board-1',
      userId: 'user-1',
      type: 'COMMENT_ADDED',
      description: 'Comentário adicionado',
    });

    await cardActivitiesRepository.create({
      cardId: 'card-4',
      boardId: 'board-2',
      userId: 'user-1',
      type: 'CREATED',
      description: 'Cartão de outro board',
    });
  });

  it('should list activities for a board', async () => {
    const { activities, total } = await sut.execute({ boardId: 'board-1' });

    expect(activities).toHaveLength(3);
    expect(total).toBe(3);
  });

  it('should paginate board activities', async () => {
    const { activities, total } = await sut.execute({
      boardId: 'board-1',
      page: 1,
      limit: 2,
    });

    expect(activities).toHaveLength(2);
    expect(total).toBe(3);

    const { activities: secondPage } = await sut.execute({
      boardId: 'board-1',
      page: 2,
      limit: 2,
    });

    expect(secondPage).toHaveLength(1);
  });

  it('should return newest activities first', async () => {
    const { activities } = await sut.execute({ boardId: 'board-1' });

    for (let i = 0; i < activities.length - 1; i++) {
      expect(activities[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        activities[i + 1].createdAt.getTime(),
      );
    }
  });

  it('should not include activities from other boards', async () => {
    const { activities } = await sut.execute({ boardId: 'board-1' });

    for (const activity of activities) {
      expect(activity.boardId).toBe('board-1');
    }
  });

  it('should filter by activity type', async () => {
    const { activities, total } = await sut.execute({
      boardId: 'board-1',
      type: 'CREATED',
    });

    expect(activities).toHaveLength(1);
    expect(total).toBe(1);
    expect(activities[0].type).toBe('CREATED');
  });
});
