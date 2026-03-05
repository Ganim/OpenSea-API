import { describe, it, expect, beforeEach } from 'vitest';
import { GetBoardUseCase } from './get-board';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardColumnsRepository } from '@/repositories/tasks/in-memory/in-memory-board-columns-repository';
import { InMemoryBoardLabelsRepository } from '@/repositories/tasks/in-memory/in-memory-board-labels-repository';
import { InMemoryBoardMembersRepository } from '@/repositories/tasks/in-memory/in-memory-board-members-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardColumnsRepository: InMemoryBoardColumnsRepository;
let boardLabelsRepository: InMemoryBoardLabelsRepository;
let boardMembersRepository: InMemoryBoardMembersRepository;
let sut: GetBoardUseCase;

describe('GetBoardUseCase', () => {
  beforeEach(() => {
    boardsRepository = new InMemoryBoardsRepository();
    boardColumnsRepository = new InMemoryBoardColumnsRepository();
    boardLabelsRepository = new InMemoryBoardLabelsRepository();
    boardMembersRepository = new InMemoryBoardMembersRepository();
    sut = new GetBoardUseCase(
      boardsRepository,
      boardColumnsRepository,
      boardLabelsRepository,
      boardMembersRepository,
    );
  });

  it('should get own board with relations', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'My Board',
      ownerId: 'user-1',
    });

    const boardId = createdBoard.id.toString();

    await boardColumnsRepository.create({
      boardId,
      title: 'To Do',
      position: 0,
      isDefault: true,
    });

    await boardLabelsRepository.create({
      boardId,
      name: 'Bug',
      color: '#ff0000',
    });

    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
    });

    expect(board.title).toBe('My Board');
    expect(board.columns).toHaveLength(1);
    expect(board.labels).toHaveLength(1);
    expect(board.labels[0].name).toBe('Bug');
  });

  it('should allow shared board member to access the board', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Shared Board',
      ownerId: 'user-1',
    });

    const boardId = createdBoard.id.toString();

    await boardMembersRepository.create({
      boardId,
      userId: 'user-2',
      role: 'EDITOR',
    });

    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-2',
      boardId,
    });

    expect(board.title).toBe('Shared Board');
  });

  it('should reject access for non-owner and non-member', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Private Board',
      ownerId: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-3',
        boardId: createdBoard.id.toString(),
      }),
    ).rejects.toThrow('You do not have access to this board');
  });

  it('should reject if board not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'non-existent-id',
      }),
    ).rejects.toThrow('Board not found');
  });
});
