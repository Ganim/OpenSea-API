import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateBoardMemberUseCase } from './update-board-member';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardMembersRepository } from '@/repositories/tasks/in-memory/in-memory-board-members-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardMembersRepository: InMemoryBoardMembersRepository;
let sut: UpdateBoardMemberUseCase;

describe('UpdateBoardMemberUseCase', () => {
  beforeEach(() => {
    boardsRepository = new InMemoryBoardsRepository();
    boardMembersRepository = new InMemoryBoardMembersRepository();
    sut = new UpdateBoardMemberUseCase(
      boardsRepository,
      boardMembersRepository,
    );
  });

  it('should update member role', async () => {
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

    const { member } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      targetUserId: 'user-2',
      role: 'EDITOR',
    });

    expect(member.role).toBe('EDITOR');
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
      role: 'VIEWER',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        boardId,
        targetUserId: 'user-2',
        role: 'EDITOR',
      }),
    ).rejects.toThrow('Only the board owner can update member roles');
  });

  it('should reject if member not found', async () => {
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
        targetUserId: 'user-99',
        role: 'EDITOR',
      }),
    ).rejects.toThrow('Board member not found');
  });
});
