import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteSubtaskUseCase } from './delete-subtask';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: DeleteSubtaskUseCase;

describe('DeleteSubtaskUseCase', () => {
  beforeEach(() => {
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new DeleteSubtaskUseCase(cardsRepository, cardActivitiesRepository);
  });

  it('should soft delete a subtask', async () => {
    const parentCard = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    const subtask = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask To Delete',
      reporterId: 'user-1',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      subtaskId: subtask.id.toString(),
    });

    const deletedSubtask = cardsRepository.items.find(
      (card) => card.id.toString() === subtask.id.toString(),
    );
    expect(deletedSubtask?.deletedAt).toBeTruthy();
  });

  it('should record activity on the parent card', async () => {
    const parentCard = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Parent Task',
      reporterId: 'user-1',
    });

    const subtask = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      parentCardId: parentCard.id.toString(),
      title: 'Subtask To Delete',
      reporterId: 'user-1',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      subtaskId: subtask.id.toString(),
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    const activity = cardActivitiesRepository.items[0];
    expect(activity.cardId).toBe(parentCard.id.toString());
    expect(activity.type).toBe('SUBTASK_REMOVED');
    expect(activity.description).toContain('John Doe');
    expect(activity.description).toContain('Subtask To Delete');
    expect(activity.description).toContain('Parent Task');
  });

  it('should reject if subtask is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'John Doe',
        boardId: 'board-1',
        subtaskId: 'non-existent',
      }),
    ).rejects.toThrow('Subtask not found');
  });
});
