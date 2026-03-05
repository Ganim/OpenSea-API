import { describe, it, expect, beforeEach } from 'vitest';
import { ReorderColumnsUseCase } from './reorder-columns';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardColumnsRepository } from '@/repositories/tasks/in-memory/in-memory-board-columns-repository';

let boardsRepository: InMemoryBoardsRepository;
let columnsRepository: InMemoryBoardColumnsRepository;
let sut: ReorderColumnsUseCase;

describe('ReorderColumnsUseCase', () => {
  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    columnsRepository = new InMemoryBoardColumnsRepository();
    sut = new ReorderColumnsUseCase(boardsRepository, columnsRepository);

    await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Board',
      ownerId: 'user-1',
    });
  });

  it('should reorder columns', async () => {
    const board = boardsRepository.items[0];
    const boardId = board.id.toString();

    const columnA = await columnsRepository.create({
      boardId,
      title: 'To Do',
      position: 0,
    });

    const columnB = await columnsRepository.create({
      boardId,
      title: 'In Progress',
      position: 1,
    });

    const columnC = await columnsRepository.create({
      boardId,
      title: 'Done',
      position: 2,
    });

    const { columns } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      columnIds: [columnC.id, columnA.id, columnB.id],
    });

    expect(columns[0].id).toBe(columnC.id);
    expect(columns[0].position).toBe(0);
    expect(columns[1].id).toBe(columnA.id);
    expect(columns[1].position).toBe(1);
    expect(columns[2].id).toBe(columnB.id);
    expect(columns[2].position).toBe(2);
  });

  it('should reject if column IDs do not match board columns', async () => {
    const board = boardsRepository.items[0];
    const boardId = board.id.toString();

    await columnsRepository.create({
      boardId,
      title: 'To Do',
      position: 0,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        columnIds: ['non-existent-id'],
      }),
    ).rejects.toThrow('Provided column IDs do not match all board columns');
  });

  it('should reject if missing columns in the reorder list', async () => {
    const board = boardsRepository.items[0];
    const boardId = board.id.toString();

    const columnA = await columnsRepository.create({
      boardId,
      title: 'To Do',
      position: 0,
    });

    await columnsRepository.create({
      boardId,
      title: 'In Progress',
      position: 1,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        columnIds: [columnA.id],
      }),
    ).rejects.toThrow('Provided column IDs do not match all board columns');
  });
});
