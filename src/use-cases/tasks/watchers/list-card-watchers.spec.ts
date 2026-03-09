import { describe, it, expect, beforeEach } from 'vitest';
import { ListCardWatchersUseCase } from './list-card-watchers';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardWatchersRepository } from '@/repositories/tasks/in-memory/in-memory-card-watchers-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardWatchersRepository: InMemoryCardWatchersRepository;
let sut: ListCardWatchersUseCase;

describe('ListCardWatchersUseCase', () => {
  let boardId: string;
  const cardId = 'card-1';

  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardWatchersRepository = new InMemoryCardWatchersRepository();
    sut = new ListCardWatchersUseCase(boardsRepository, cardWatchersRepository);

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });

    boardId = boardsRepository.items[0].id.toString();
  });

  it('should return an empty list when there are no watchers', async () => {
    const { watchers } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      cardId,
    });

    expect(watchers).toHaveLength(0);
  });

  it('should return all watchers for a card', async () => {
    await cardWatchersRepository.create({
      cardId,
      userId: 'user-1',
      boardId,
    });

    await cardWatchersRepository.create({
      cardId,
      userId: 'user-2',
      boardId,
    });

    const { watchers } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      cardId,
    });

    expect(watchers).toHaveLength(2);
  });

  it('should not return watchers from other cards', async () => {
    await cardWatchersRepository.create({
      cardId,
      userId: 'user-1',
      boardId,
    });

    await cardWatchersRepository.create({
      cardId: 'other-card',
      userId: 'user-2',
      boardId,
    });

    const { watchers } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      cardId,
    });

    expect(watchers).toHaveLength(1);
    expect(watchers[0].userId).toBe('user-1');
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId: 'nonexistent-board',
        cardId,
      }),
    ).rejects.toThrow('Board not found');
  });
});
