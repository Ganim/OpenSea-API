import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateBoardUseCase } from './update-board';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';

let boardsRepository: InMemoryBoardsRepository;
let sut: UpdateBoardUseCase;

describe('UpdateBoardUseCase', () => {
  beforeEach(() => {
    boardsRepository = new InMemoryBoardsRepository();
    sut = new UpdateBoardUseCase(boardsRepository);
  });

  it('should update board title', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Original Title',
      ownerId: 'user-1',
    });

    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: createdBoard.id.toString(),
      title: 'Updated Title',
    });

    expect(board.title).toBe('Updated Title');
  });

  it('should update board settings', async () => {
    const createdBoard = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'My Board',
      ownerId: 'user-1',
    });

    const customSettings = { showCompletedCards: false, cardSize: 'compact' };

    const { board } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      boardId: createdBoard.id.toString(),
      settings: customSettings,
    });

    expect(board.settings).toEqual(customSettings);
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
        title: 'Hacked Title',
      }),
    ).rejects.toThrow('Only the board owner can update this board');
  });

  it('should reject if board not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        boardId: 'non-existent-id',
        title: 'New Title',
      }),
    ).rejects.toThrow('Board not found');
  });
});
