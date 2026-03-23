import { describe, it, expect, beforeEach } from 'vitest';
import { ListChecklistsUseCase } from './list-checklists';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardChecklistsRepository } from '@/repositories/tasks/in-memory/in-memory-card-checklists-repository';

let cardsRepository: InMemoryCardsRepository;
let cardChecklistsRepository: InMemoryCardChecklistsRepository;
let sut: ListChecklistsUseCase;

describe('ListChecklistsUseCase', () => {
  beforeEach(() => {
    cardsRepository = new InMemoryCardsRepository();
    cardChecklistsRepository = new InMemoryCardChecklistsRepository();
    sut = new ListChecklistsUseCase(cardsRepository, cardChecklistsRepository);
  });

  it('should list all checklists for a card', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    const cardId = card.id.toString();

    await cardChecklistsRepository.create({
      cardId,
      title: 'First Checklist',
      position: 0,
    });

    await cardChecklistsRepository.create({
      cardId,
      title: 'Second Checklist',
      position: 1,
    });

    const { checklists } = await sut.execute({
      boardId: 'board-1',
      cardId,
    });

    expect(checklists).toHaveLength(2);
    expect(checklists[0].title).toBe('First Checklist');
    expect(checklists[1].title).toBe('Second Checklist');
  });

  it('should return checklists with their items', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    const cardId = card.id.toString();

    const checklist = await cardChecklistsRepository.create({
      cardId,
      title: 'My Checklist',
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

    const { checklists } = await sut.execute({
      boardId: 'board-1',
      cardId,
    });

    expect(checklists).toHaveLength(1);
    expect(checklists[0].items).toHaveLength(2);
    expect(checklists[0].items[0].title).toBe('Item 1');
    expect(checklists[0].items[1].title).toBe('Item 2');
  });

  it('should return empty array when card has no checklists', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    const { checklists } = await sut.execute({
      boardId: 'board-1',
      cardId: card.id.toString(),
    });

    expect(checklists).toHaveLength(0);
  });

  it('should reject if card is not found', async () => {
    await expect(
      sut.execute({
        boardId: 'board-1',
        cardId: 'non-existent-card',
      }),
    ).rejects.toThrow('Card not found');
  });
});
