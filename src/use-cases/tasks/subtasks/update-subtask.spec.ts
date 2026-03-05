import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateSubtaskUseCase } from './update-subtask';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: UpdateSubtaskUseCase;

describe('UpdateSubtaskUseCase', () => {
  beforeEach(() => {
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new UpdateSubtaskUseCase(cardsRepository, cardActivitiesRepository);
  });

  it('should update subtask fields', async () => {
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
      title: 'Original Title',
      reporterId: 'user-1',
    });

    const { subtask: updatedSubtask } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      subtaskId: subtask.id.toString(),
      title: 'Updated Title',
      priority: 'HIGH',
    });

    expect(updatedSubtask.title).toBe('Updated Title');
    expect(updatedSubtask.priority).toBe('HIGH');
    expect(cardActivitiesRepository.items).toHaveLength(1);
    expect(cardActivitiesRepository.items[0].type).toBe('SUBTASK_UPDATED');
  });

  it('should reject if card is not a subtask', async () => {
    const regularCard = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Regular Card',
      reporterId: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'John Doe',
        boardId: 'board-1',
        subtaskId: regularCard.id.toString(),
        title: 'New Title',
      }),
    ).rejects.toThrow('Card is not a subtask');
  });

  it('should reject if subtask is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'John Doe',
        boardId: 'board-1',
        subtaskId: 'non-existent',
        title: 'New Title',
      }),
    ).rejects.toThrow('Subtask not found');
  });
});
