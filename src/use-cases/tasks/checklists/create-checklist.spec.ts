import { describe, it, expect, beforeEach } from 'vitest';
import { CreateChecklistUseCase } from './create-checklist';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardChecklistsRepository } from '@/repositories/tasks/in-memory/in-memory-card-checklists-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardsRepository: InMemoryCardsRepository;
let cardChecklistsRepository: InMemoryCardChecklistsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: CreateChecklistUseCase;

describe('CreateChecklistUseCase', () => {
  beforeEach(() => {
    cardsRepository = new InMemoryCardsRepository();
    cardChecklistsRepository = new InMemoryCardChecklistsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new CreateChecklistUseCase(cardsRepository, cardChecklistsRepository, cardActivitiesRepository);
  });

  it('should create a checklist on a card', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    const { checklist } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      cardId: card.id.toString(),
      title: 'My Checklist',
    });

    expect(checklist.title).toBe('My Checklist');
    expect(checklist.cardId).toBe(card.id.toString());
    expect(checklist.position).toBe(0);
    expect(checklist.items).toHaveLength(0);
    expect(cardChecklistsRepository.checklists).toHaveLength(1);
  });

  it('should auto-calculate position for subsequent checklists', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    const cardId = card.id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      cardId,
      title: 'First Checklist',
    });

    const { checklist: secondChecklist } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'John Doe',
      boardId: 'board-1',
      cardId,
      title: 'Second Checklist',
    });

    expect(secondChecklist.position).toBe(1);
    expect(cardChecklistsRepository.checklists).toHaveLength(2);
  });

  it('should reject empty title', async () => {
    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'board-1',
        cardId: card.id.toString(),
        title: '   ',
      }),
    ).rejects.toThrow('Checklist title is required');
  });

  it('should reject if card is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'board-1',
        cardId: 'non-existent-card',
        title: 'My Checklist',
      }),
    ).rejects.toThrow('Card not found');
  });
});
