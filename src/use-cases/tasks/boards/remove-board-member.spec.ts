import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveBoardMemberUseCase } from './remove-board-member';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardMembersRepository } from '@/repositories/tasks/in-memory/in-memory-board-members-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardMembersRepository: InMemoryBoardMembersRepository;
let sut: RemoveBoardMemberUseCase;

describe('RemoveBoardMemberUseCase', () => {
  beforeEach(() => {
    boardsRepository = new InMemoryBoardsRepository();
    boardMembersRepository = new InMemoryBoardMembersRepository();
    sut = new RemoveBoardMemberUseCase(
      boardsRepository,
      boardMembersRepository,
    );
  });

  it('should remove a board member', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'My Board',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    const boardId = createdBoard.id.toString();

    await boardMembersRepository.create({
      boardId,
      userId: 'user-2',
      role: 'VIEWER',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      targetUserId: 'user-2',
    });

    expect(boardMembersRepository.items).toHaveLength(0);
  });

  it('should reject if user is not the owner', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Owner Board',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    const boardId = createdBoard.id.toString();

    await boardMembersRepository.create({
      boardId,
      userId: 'user-2',
      role: 'EDITOR',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        boardId,
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow('Only the board owner can remove members');
  });

  it('should reject removing yourself as owner', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'My Board',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: createdBoard.id.toString(),
        targetUserId: 'user-1',
      }),
    ).rejects.toThrow('Cannot remove yourself from your own board');
  });
});
