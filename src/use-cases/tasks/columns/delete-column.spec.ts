import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteColumnUseCase } from './delete-column';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardColumnsRepository } from '@/repositories/tasks/in-memory/in-memory-board-columns-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';

let boardsRepository: InMemoryBoardsRepository;
let columnsRepository: InMemoryBoardColumnsRepository;
let cardsRepository: InMemoryCardsRepository;
let sut: DeleteColumnUseCase;

describe('DeleteColumnUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    columnsRepository = new InMemoryBoardColumnsRepository();
    cardsRepository = new InMemoryCardsRepository();
    sut = new DeleteColumnUseCase(
      boardsRepository,
      columnsRepository,
      cardsRepository,
    );

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });
  });

  it('should delete column and move cards to default column', async () => {
    const board = boardsRepository.items[0];
    const boardId = board.id.toString();

    const defaultColumn = await columnsRepository.create({
      boardId,
      title: 'To Do',
      position: 0,
      isDefault: true,
    });

    const columnToDelete = await columnsRepository.create({
      boardId,
      title: 'In Progress',
      position: 1,
    });

    await cardsRepository.create({
      boardId,
      columnId: columnToDelete.id,
      title: 'Card 1',
      reporterId: 'user-1',
    });

    await cardsRepository.create({
      boardId,
      columnId: columnToDelete.id,
      title: 'Card 2',
      reporterId: 'user-1',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      columnId: columnToDelete.id,
    });

    expect(columnsRepository.items).toHaveLength(1);
    expect(columnsRepository.items[0].id).toBe(defaultColumn.id);

    const movedCards = cardsRepository.items.filter(
      (card) => card.columnId.toString() === defaultColumn.id,
    );
    expect(movedCards).toHaveLength(2);
  });

  it('should reject deleting the default column', async () => {
    const board = boardsRepository.items[0];
    const boardId = board.id.toString();

    const defaultColumn = await columnsRepository.create({
      boardId,
      title: 'To Do',
      position: 0,
      isDefault: true,
    });

    await columnsRepository.create({
      boardId,
      title: 'Done',
      position: 1,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        columnId: defaultColumn.id,
      }),
    ).rejects.toThrow('Cannot delete the default column');
  });

  it('should reject deleting the last remaining column', async () => {
    const board = boardsRepository.items[0];
    const boardId = board.id.toString();

    const onlyColumn = await columnsRepository.create({
      boardId,
      title: 'To Do',
      position: 0,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        columnId: onlyColumn.id,
      }),
    ).rejects.toThrow('Cannot delete the last remaining column');
  });

  it('should reject if column is not found', async () => {
    const board = boardsRepository.items[0];

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: board.id.toString(),
        columnId: 'non-existent-column-id',
      }),
    ).rejects.toThrow('Column not found');
  });
});
