import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateColumnUseCase } from './update-column';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardColumnsRepository } from '@/repositories/tasks/in-memory/in-memory-board-columns-repository';

let boardsRepository: InMemoryBoardsRepository;
let columnsRepository: InMemoryBoardColumnsRepository;
let sut: UpdateColumnUseCase;

describe('UpdateColumnUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    columnsRepository = new InMemoryBoardColumnsRepository();
    sut = new UpdateColumnUseCase(boardsRepository, columnsRepository);

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });
  });

  it('should update column title', async () => {
    const board = boardsRepository.items[0];
    const boardId = board.id.toString();

    const createdColumn = await columnsRepository.create({
      boardId,
      title: 'To Do',
      position: 0,
    });

    const { column } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      columnId: createdColumn.id,
      title: 'Backlog',
    });

    expect(column.title).toBe('Backlog');
  });

  it('should update column wipLimit', async () => {
    const board = boardsRepository.items[0];
    const boardId = board.id.toString();

    const createdColumn = await columnsRepository.create({
      boardId,
      title: 'In Progress',
      position: 0,
    });

    const { column } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      columnId: createdColumn.id,
      wipLimit: 5,
    });

    expect(column.wipLimit).toBe(5);
  });

  it('should reject if column is not found', async () => {
    const board = boardsRepository.items[0];

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: board.id.toString(),
        columnId: 'non-existent-column-id',
        title: 'Updated',
      }),
    ).rejects.toThrow('Column not found');
  });
});
