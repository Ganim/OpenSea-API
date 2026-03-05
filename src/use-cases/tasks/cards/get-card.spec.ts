import { describe, it, expect, beforeEach } from 'vitest';
import { GetCardUseCase } from './get-card';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let sut: GetCardUseCase;

describe('GetCardUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    sut = new GetCardUseCase(boardsRepository, cardsRepository);

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });
  });

  it('should get a card with its relations', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    const createdCard = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Test Card',
      description: 'Test description',
      reporterId: 'user-1',
      position: 0,
      labelIds: ['label-1', 'label-2'],
    });

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Subtask 1',
      reporterId: 'user-1',
      parentCardId: createdCard.id.toString(),
      position: 0,
    });

    const { card } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      cardId: createdCard.id.toString(),
    });

    expect(card.title).toBe('Test Card');
    expect(card.description).toBe('Test description');
    expect(card.labels).toHaveLength(2);
    expect(card.subtaskCount).toBe(1);
  });

  it('should reject if card is not found', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        cardId: 'nonexistent-card',
      }),
    ).rejects.toThrow('Card not found');
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'nonexistent-board',
        cardId: 'card-1',
      }),
    ).rejects.toThrow('Board not found');
  });
});
