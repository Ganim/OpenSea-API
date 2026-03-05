import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteChecklistUseCase } from './delete-checklist';
import { InMemoryCardChecklistsRepository } from '@/repositories/tasks/in-memory/in-memory-card-checklists-repository';

let cardChecklistsRepository: InMemoryCardChecklistsRepository;
let sut: DeleteChecklistUseCase;

describe('DeleteChecklistUseCase', () => {
  beforeEach(() => {
    cardChecklistsRepository = new InMemoryCardChecklistsRepository();
    sut = new DeleteChecklistUseCase(cardChecklistsRepository);
  });

  it('should delete a checklist and cascade delete its items', async () => {
    const checklist = await cardChecklistsRepository.create({
      cardId: 'card-1',
      title: 'To Delete',
      position: 0,
    });

    await cardChecklistsRepository.addItem({
      checklistId: checklist.id,
      title: 'Item 1',
      position: 0,
    });

    await cardChecklistsRepository.addItem({
      checklistId: checklist.id,
      title: 'Item 2',
      position: 1,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      cardId: 'card-1',
      checklistId: checklist.id,
    });

    expect(cardChecklistsRepository.checklists).toHaveLength(0);
    expect(cardChecklistsRepository.checklistItems).toHaveLength(0);
  });

  it('should reject if checklist is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'board-1',
        cardId: 'card-1',
        checklistId: 'non-existent',
      }),
    ).rejects.toThrow('Checklist not found');
  });
});
