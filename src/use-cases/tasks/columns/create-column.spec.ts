import { describe, it, expect, beforeEach } from 'vitest';
import { CreateColumnUseCase } from './create-column';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardColumnsRepository } from '@/repositories/tasks/in-memory/in-memory-board-columns-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let boardsRepository: InMemoryBoardsRepository;
let columnsRepository: InMemoryBoardColumnsRepository;
let sut: CreateColumnUseCase;

describe('CreateColumnUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    columnsRepository = new InMemoryBoardColumnsRepository();
    sut = new CreateColumnUseCase(boardsRepository, columnsRepository);

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });
  });

  it('should create a column on the board', async () => {
    const board = boardsRepository.items[0];

    const { column } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: board.id.toString(),
      title: 'In Progress',
      color: '#3b82f6',
    });

    expect(column.title).toBe('In Progress');
    expect(column.color).toBe('#3b82f6');
    expect(column.position).toBe(0);
    expect(columnsRepository.items).toHaveLength(1);
  });

  it('should auto-calculate position based on existing columns', async () => {
    const board = boardsRepository.items[0];
    const boardId = board.id.toString();

    await columnsRepository.create({
      boardId,
      title: 'To Do',
      position: 0,
    });

    await columnsRepository.create({
      boardId,
      title: 'In Progress',
      position: 1,
    });

    const { column } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      title: 'Done',
    });

    expect(column.position).toBe(2);
  });

  it('should reject empty title', async () => {
    const board = boardsRepository.items[0];

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: board.id.toString(),
        title: '',
      }),
    ).rejects.toThrow('Column title is required');
  });

  it('should reject if board is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'non-existent-board-id',
        title: 'Some Column',
      }),
    ).rejects.toThrow('Board not found');
  });
});
