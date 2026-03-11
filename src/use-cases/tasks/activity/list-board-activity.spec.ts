import { describe, it, expect, beforeEach } from 'vitest';
import { ListBoardActivityUseCase } from './list-board-activity';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: ListBoardActivityUseCase;

describe('ListBoardActivityUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new ListBoardActivityUseCase(
      boardsRepository,
      cardActivitiesRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Board 1',
      type: 'KANBAN',
      ownerId: 'user-1',
      position: 0,
    });

    await boardsRepository.create({
      tenantId: 'tenant-2',
      title: 'Board 2',
      type: 'KANBAN',
      ownerId: 'user-2',
      position: 0,
    });

    const board1Id = boardsRepository.items[0].id.toString();
    const board2Id = boardsRepository.items[1].id.toString();

    await cardActivitiesRepository.create({
      cardId: 'card-1',
      boardId: board1Id,
      userId: 'user-1',
      type: 'CREATED',
      description: 'Cartão 1 criado',
    });

    await cardActivitiesRepository.create({
      cardId: 'card-2',
      boardId: board1Id,
      userId: 'user-2',
      type: 'FIELD_CHANGED',
      description: 'Status alterado',
    });

    await cardActivitiesRepository.create({
      cardId: 'card-3',
      boardId: board1Id,
      userId: 'user-1',
      type: 'COMMENT_ADDED',
      description: 'Comentário adicionado',
    });

    await cardActivitiesRepository.create({
      cardId: 'card-4',
      boardId: board2Id,
      userId: 'user-1',
      type: 'CREATED',
      description: 'Cartão de outro board',
    });
  });

  it('should list activities for a board', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const { activities, total } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
    });

    expect(activities).toHaveLength(3);
    expect(total).toBe(3);
  });

  it('should paginate board activities', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const { activities, total } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      page: 1,
      limit: 2,
    });

    expect(activities).toHaveLength(2);
    expect(total).toBe(3);

    const { activities: secondPage } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      page: 2,
      limit: 2,
    });

    expect(secondPage).toHaveLength(1);
  });

  it('should return newest activities first', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const { activities } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
    });

    for (let i = 0; i < activities.length - 1; i++) {
      expect(activities[i].createdAt.getTime()).toBeGreaterThanOrEqual(
        activities[i + 1].createdAt.getTime(),
      );
    }
  });

  it('should not include activities from other boards', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const { activities } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
    });

    for (const activity of activities) {
      expect(activity.boardId).toBe(boardId);
    }
  });

  it('should filter by activity type', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const { activities, total } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      type: 'CREATED',
    });

    expect(activities).toHaveLength(1);
    expect(total).toBe(1);
    expect(activities[0].type).toBe('CREATED');
  });

  it('should reject if board does not belong to tenant (cross-tenant isolation)', async () => {
    const board1Id = boardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        boardId: board1Id,
      }),
    ).rejects.toThrow('Board not found');
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId: 'nonexistent-board',
      }),
    ).rejects.toThrow('Board not found');
  });
});
