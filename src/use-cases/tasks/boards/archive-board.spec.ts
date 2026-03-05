import { describe, it, expect, beforeEach } from 'vitest';
import { ArchiveBoardUseCase } from './archive-board';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';

let boardsRepository: InMemoryBoardsRepository;
let sut: ArchiveBoardUseCase;

describe('ArchiveBoardUseCase', () => {
  beforeEach(() => {
    boardsRepository = new InMemoryBoardsRepository();
    sut = new ArchiveBoardUseCase(boardsRepository);
  });

  it('should archive a board', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Board to Archive',
      ownerId: 'user-1',
    });

    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: createdBoard.id.toString(),
      archive: true,
    });

    expect(board.archivedAt).toBeTruthy();
  });

  it('should restore an archived board', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Archived Board',
      ownerId: 'user-1',
    });

    await boardsRepository.archive(createdBoard.id.toString(), 'tenant-1');

    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: createdBoard.id.toString(),
      archive: false,
    });

    expect(board.archivedAt).toBeNull();
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
        archive: true,
      }),
    ).rejects.toThrow('Only the board owner can archive this board');
  });
});
