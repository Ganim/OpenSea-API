import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveChecklistItemUseCase } from './remove-checklist-item';
import { InMemoryCardChecklistsRepository } from '@/repositories/tasks/in-memory/in-memory-card-checklists-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardChecklistsRepository: InMemoryCardChecklistsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: RemoveChecklistItemUseCase;

describe('RemoveChecklistItemUseCase', () => {
  beforeEach(async () => {
    cardChecklistsRepository = new InMemoryCardChecklistsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new RemoveChecklistItemUseCase(
      cardChecklistsRepository,
      cardsRepository,
      cardActivitiesRepository,
    );

    await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
      position: 0,
    });
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
      userName: 'User 1',
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
        userName: 'User 1',
        boardId: 'board-1',
        cardId: 'card-1',
        checklistId: 'non-existent',
        itemId: 'non-existent',
      }),
    ).rejects.toThrow('Checklist item not found');
  });
});
