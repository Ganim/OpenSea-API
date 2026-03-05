import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteBoardUseCase } from './delete-board';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';

let boardsRepository: InMemoryBoardsRepository;
let sut: DeleteBoardUseCase;

describe('DeleteBoardUseCase', () => {
  beforeEach(() => {
    boardsRepository = new InMemoryBoardsRepository();
    sut = new DeleteBoardUseCase(boardsRepository);
  });

  it('should soft delete a board', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Board to Delete',
      ownerId: 'user-1',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: createdBoard.id.toString(),
    });

    const deletedBoard = boardsRepository.items.find(
      (board) => board.id.toString() === createdBoard.id.toString(),
    );

    expect(deletedBoard?.deletedAt).toBeTruthy();
  });

  it('should reject if user is not the owner', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Owner Board',
      ownerId: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        boardId: createdBoard.id.toString(),
      }),
    ).rejects.toThrow('Only the board owner can delete this board');
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
