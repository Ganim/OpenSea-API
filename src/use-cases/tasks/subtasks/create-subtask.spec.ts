import { describe, it, expect, beforeEach } from 'vitest';
import { CreateSubtaskUseCase } from './create-subtask';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: CreateSubtaskUseCase;
let boardId: string;

describe('CreateSubtaskUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new CreateSubtaskUseCase(
      boardsRepository,
      cardsRepository,
      cardActivitiesRepository,
    );

    const board = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });
    boardId = board.id.toString();
  });

  it('should create a subtask under a parent card', async () => {
    const parentCard = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    const { subtask } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId,
      parentCardId: parentCard.id.toString(),
      title: 'Subtask 1',
      description: 'A subtask description',
    });

    expect(subtask.title).toBe('Subtask 1');
    expect(subtask.description).toBe('A subtask description');
    expect(subtask.parentCardId?.toString()).toBe(parentCard.id.toString());
    expect(subtask.columnId.toString()).toBe('column-1');
    expect(subtask.boardId.toString()).toBe(boardId);
    expect(subtask.isSubtask).toBe(true);
    expect(cardsRepository.items).toHaveLength(2);
  });

  it('should reject creating a subtask of a subtask (max 1 level nesting)', async () => {
    const parentCard = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    const subtaskCard = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask',
      reporterId: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'John Doe',
        boardId,
        parentCardId: subtaskCard.id.toString(),
        title: 'Sub-subtask',
      }),
    ).rejects.toThrow(
      'Cannot create a subtask of a subtask. Only one level of nesting is allowed.',
    );
  });

  it('should reject if parent card is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'John Doe',
        boardId,
        parentCardId: 'non-existent-card',
        title: 'Subtask',
      }),
    ).rejects.toThrow('Parent card not found');
  });

  it('should reject if board is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'John Doe',
        boardId: 'non-existent-board',
        parentCardId: 'some-card',
        title: 'Subtask',
      }),
    ).rejects.toThrow('Board not found');
  });

  it('should record activity on the parent card', async () => {
    const parentCard = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId,
      parentCardId: parentCard.id.toString(),
      title: 'New Subtask',
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    const activity = cardActivitiesRepository.items[0];
    expect(activity.cardId).toBe(parentCard.id.toString());
    expect(activity.type).toBe('SUBTASK_ADDED');
    expect(activity.description).toContain('John Doe');
    expect(activity.description).toContain('New Subtask');
    expect(activity.description).toContain('Parent Task');
  });
});
