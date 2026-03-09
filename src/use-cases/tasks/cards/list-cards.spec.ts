import { describe, it, expect, beforeEach } from 'vitest';
import { ListCardsUseCase } from './list-cards';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryBoardMembersRepository } from '@/repositories/tasks/in-memory/in-memory-board-members-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let boardMembersRepository: InMemoryBoardMembersRepository;
let sut: ListCardsUseCase;

describe('ListCardsUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    boardMembersRepository = new InMemoryBoardMembersRepository();
    sut = new ListCardsUseCase(
      boardsRepository,
      cardsRepository,
      boardMembersRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });
  });

  it('should list all cards in a board', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Card 1',
      reporterId: 'user-1',
      position: 0,
    });

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Card 2',
      reporterId: 'user-1',
      position: 1,
    });

    const { cards, meta } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
    });

    expect(cards).toHaveLength(2);
    expect(meta.total).toBe(2);
    expect(meta.page).toBe(1);
  });

  it('should filter cards by column', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Card in Col 1',
      reporterId: 'user-1',
      position: 0,
    });

    await cardsRepository.create({
      boardId,
      columnId: 'column-2',
      title: 'Card in Col 2',
      reporterId: 'user-1',
      position: 0,
    });

    const { cards } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      columnId: 'column-1',
    });

    expect(cards).toHaveLength(1);
    expect(cards[0].title).toBe('Card in Col 1');
  });

  it('should filter cards by assignee', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Assigned Card',
      reporterId: 'user-1',
      assigneeId: 'user-2',
      position: 0,
    });

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Unassigned Card',
      reporterId: 'user-1',
      position: 1,
    });

    const { cards } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      assigneeId: 'user-2',
    });

    expect(cards).toHaveLength(1);
    expect(cards[0].title).toBe('Assigned Card');
  });

  it('should filter cards by priority', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'High Priority',
      reporterId: 'user-1',
      priority: 'HIGH',
      position: 0,
    });

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Low Priority',
      reporterId: 'user-1',
      priority: 'LOW',
      position: 1,
    });

    const { cards } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      priority: 'HIGH',
    });

    expect(cards).toHaveLength(1);
    expect(cards[0].title).toBe('High Priority');
  });

  it('should paginate results', async () => {
    const boardId = boardsRepository.items[0].id.toString();

    for (let i = 0; i < 5; i++) {
      await cardsRepository.create({
        boardId,
        columnId: 'column-1',
        title: `Card ${i}`,
        reporterId: 'user-1',
        position: i,
      });
    }

    const { cards, meta } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      page: 1,
      limit: 2,
    });

    expect(cards).toHaveLength(2);
    expect(meta.total).toBe(5);
    expect(meta.pages).toBe(3);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(2);
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'nonexistent-board',
      }),
    ).rejects.toThrow('Board not found');
  });
});
