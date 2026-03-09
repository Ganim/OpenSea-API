import { describe, it, expect, beforeEach } from 'vitest';
import { UnwatchCardUseCase } from './unwatch-card';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardWatchersRepository } from '@/repositories/tasks/in-memory/in-memory-card-watchers-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardWatchersRepository: InMemoryCardWatchersRepository;
let sut: UnwatchCardUseCase;

describe('UnwatchCardUseCase', () => {
  let boardId: string;
  const cardId = 'card-1';

  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardWatchersRepository = new InMemoryCardWatchersRepository();
    sut = new UnwatchCardUseCase(boardsRepository, cardWatchersRepository);

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });

    boardId = boardsRepository.items[0].id.toString();

    await cardWatchersRepository.create({
      cardId,
      userId: 'user-1',
      boardId,
    });
  });

  it('should unwatch a card', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      cardId,
    });

    expect(cardWatchersRepository.items).toHaveLength(0);
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

  it('should reject if user is not watching the card', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        boardId,
        cardId,
      }),
    ).rejects.toThrow('User is not watching this card');
  });

  it('should only remove the specific user watcher', async () => {
    await cardWatchersRepository.create({
      cardId,
      userId: 'user-2',
      boardId,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      cardId,
    });

    expect(cardWatchersRepository.items).toHaveLength(1);
    expect(cardWatchersRepository.items[0].userId).toBe('user-2');
  });
});
