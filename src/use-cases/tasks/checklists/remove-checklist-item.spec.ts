import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveChecklistItemUseCase } from './remove-checklist-item';
import { InMemoryCardChecklistsRepository } from '@/repositories/tasks/in-memory/in-memory-card-checklists-repository';

let cardChecklistsRepository: InMemoryCardChecklistsRepository;
let sut: RemoveChecklistItemUseCase;

describe('RemoveChecklistItemUseCase', () => {
  beforeEach(() => {
    cardChecklistsRepository = new InMemoryCardChecklistsRepository();
    sut = new RemoveChecklistItemUseCase(cardChecklistsRepository);
  });

  it('should remove an item from a checklist', async () => {
    const checklist = await cardChecklistsRepository.create({
      cardId: 'card-1',
      title: 'My Checklist',
      position: 0,
    });

    const item = await cardChecklistsRepository.addItem({
      checklistId: checklist.id,
      title: 'Item to remove',
      position: 0,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: 'board-1',
      cardId: 'card-1',
      checklistId: checklist.id,
      itemId: item.id,
    });

    expect(cardChecklistsRepository.checklistItems).toHaveLength(0);
  });

  it('should reject if checklist item is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'board-1',
        cardId: 'card-1',
        checklistId: 'non-existent',
        itemId: 'non-existent',
      }),
    ).rejects.toThrow('Checklist item not found');
  });
});
