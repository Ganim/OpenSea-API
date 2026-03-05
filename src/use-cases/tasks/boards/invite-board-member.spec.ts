import { describe, it, expect, beforeEach } from 'vitest';
import { InviteBoardMemberUseCase } from './invite-board-member';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryBoardMembersRepository } from '@/repositories/tasks/in-memory/in-memory-board-members-repository';

let boardsRepository: InMemoryBoardsRepository;
let boardMembersRepository: InMemoryBoardMembersRepository;
let sut: InviteBoardMemberUseCase;

describe('InviteBoardMemberUseCase', () => {
  beforeEach(() => {
    boardsRepository = new InMemoryBoardsRepository();
    boardMembersRepository = new InMemoryBoardMembersRepository();
    sut = new InviteBoardMemberUseCase(
      boardsRepository,
      boardMembersRepository,
    );
  });

  it('should invite a viewer to a personal board', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'My Board',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    const { member } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: createdBoard.id.toString(),
      targetUserId: 'user-2',
      role: 'VIEWER',
    });

    expect(member.userId).toBe('user-2');
    expect(member.role).toBe('VIEWER');
    expect(boardMembersRepository.items).toHaveLength(1);
  });

  it('should invite an editor to a personal board', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'My Board',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    const { member } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: createdBoard.id.toString(),
      targetUserId: 'user-2',
      role: 'EDITOR',
    });

    expect(member.role).toBe('EDITOR');
  });

  it('should reject inviting to a team board', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Team Board',
      ownerId: 'user-1',
      type: 'TEAM',
      teamId: 'team-1',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: createdBoard.id.toString(),
        targetUserId: 'user-2',
        role: 'VIEWER',
      }),
    ).rejects.toThrow(
      'Cannot invite members to a team board. Use team management instead',
    );
  });

  it('should reject if user is not the owner', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Owner Board',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        boardId: createdBoard.id.toString(),
        targetUserId: 'user-3',
        role: 'VIEWER',
      }),
    ).rejects.toThrow('Only the board owner can invite members');
  });

  it('should reject duplicate invitation', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'My Board',
      ownerId: 'user-1',
      type: 'PERSONAL',
    });

    const boardId = createdBoard.id.toString();

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId,
      targetUserId: 'user-2',
      role: 'VIEWER',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId,
        targetUserId: 'user-2',
        role: 'EDITOR',
      }),
    ).rejects.toThrow('User is already a member of this board');
  });
});
