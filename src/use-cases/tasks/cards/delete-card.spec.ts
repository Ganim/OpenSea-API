import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCardUseCase } from './delete-card';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: DeleteCardUseCase;

describe('DeleteCardUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new DeleteCardUseCase(
      boardsRepository,
      cardsRepository,
      cardActivitiesRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });
  });

  it('should soft delete a card', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const parentCard = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Parent Card',
      reporterId: 'user-1',
      position: 0,
    });

    const parentCardId = parentCard.id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId: parentCardId,
    });

    const deletedCard = cardsRepository.items.find(
      (card) => card.id.toString() === parentCardId,
    );

    expect(deletedCard!.deletedAt).toBeTruthy();
  });

  it('should also soft delete all subtasks', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const parentCard = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Parent Card',
      reporterId: 'user-1',
      position: 0,
    });

    const parentCardId = parentCard.id.toString();

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Subtask 1',
      reporterId: 'user-1',
      parentCardId: parentCardId,
      position: 0,
    });

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Subtask 2',
      reporterId: 'user-1',
      parentCardId: parentCardId,
      position: 1,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId: parentCardId,
    });

    const allCards = cardsRepository.items;
    const deletedCards = allCards.filter((card) => card.deletedAt !== null);

    expect(deletedCards).toHaveLength(3);
  });

  it('should reject if card is not found', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        cardId: 'nonexistent-card',
      }),
    ).rejects.toThrow('Card not found');
  });

  it('should record a DELETED activity', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const card = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Card to Delete',
      reporterId: 'user-1',
      position: 0,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId: card.id.toString(),
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    expect(cardActivitiesRepository.items[0].type).toBe('DELETED');
    expect(cardActivitiesRepository.items[0].description).toBe(
      'João excluiu o cartão Card to Delete',
    );
  });
});
