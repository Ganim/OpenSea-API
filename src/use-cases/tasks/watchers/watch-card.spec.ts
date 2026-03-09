import { describe, it, expect, beforeEach } from 'vitest';
import { WatchCardUseCase } from './watch-card';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardWatchersRepository } from '@/repositories/tasks/in-memory/in-memory-card-watchers-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardWatchersRepository: InMemoryCardWatchersRepository;
let sut: WatchCardUseCase;

describe('WatchCardUseCase', () => {
  let boardId: string;
  let cardId: string;

  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardWatchersRepository = new InMemoryCardWatchersRepository();
    sut = new WatchCardUseCase(
      boardsRepository,
      cardsRepository,
      cardWatchersRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });

    boardId = boardsRepository.items[0].id.toString();

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
    });

    cardId = cardsRepository.items[0].id.toString();
  });

  it('should watch a card', async () => {
    const { watcher } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      cardId,
    });

    expect(watcher.cardId).toBe(cardId);
    expect(watcher.userId).toBe('user-1');
    expect(watcher.boardId).toBe(boardId);
    expect(cardWatchersRepository.items).toHaveLength(1);
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'nonexistent-board',
        cardId,
      }),
    ).rejects.toThrow('Board not found');
  });

  it('should reject if card does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        cardId: 'nonexistent-card',
      }),
    ).rejects.toThrow('Card not found');
  });

  it('should reject if user is already watching the card', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      cardId,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        cardId,
      }),
    ).rejects.toThrow('User is already watching this card');
  });

  it('should allow multiple users to watch the same card', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      cardId,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-2',
      boardId,
      cardId,
    });

    expect(cardWatchersRepository.items).toHaveLength(2);
  });
});
