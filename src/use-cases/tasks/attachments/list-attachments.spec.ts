import { describe, it, expect, beforeEach } from 'vitest';
import { ListAttachmentsUseCase } from './list-attachments';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardAttachmentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-attachments-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardAttachmentsRepository: InMemoryCardAttachmentsRepository;
let sut: ListAttachmentsUseCase;

describe('ListAttachmentsUseCase', () => {
  let boardId: string;

  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardAttachmentsRepository = new InMemoryCardAttachmentsRepository();
    sut = new ListAttachmentsUseCase(
      boardsRepository,
      cardAttachmentsRepository,
    );

    const board = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Board 1',
      type: 'KANBAN',
      ownerId: 'user-1',
      position: 0,
    });

    boardId = board.id.toString();
  });

  it('should list attachments for a card', async () => {
    await cardAttachmentsRepository.create({
      cardId: 'card-1',
      fileId: 'file-1',
      addedBy: 'user-1',
    });

    await cardAttachmentsRepository.create({
      cardId: 'card-1',
      fileId: 'file-2',
      addedBy: 'user-1',
    });

    await cardAttachmentsRepository.create({
      cardId: 'card-2',
      fileId: 'file-3',
      addedBy: 'user-1',
    });

    const { attachments } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      cardId: 'card-1',
    });

    expect(attachments).toHaveLength(2);
    expect(attachments[0].fileId).toBe('file-1');
    expect(attachments[1].fileId).toBe('file-2');
  });

  it('should return empty array when card has no attachments', async () => {
    const { attachments } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      cardId: 'card-1',
    });

    expect(attachments).toHaveLength(0);
  });

  it('should reject if board does not belong to tenant (cross-tenant isolation)', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-other',
        boardId,
        cardId: 'card-1',
      }),
    ).rejects.toThrow('Board not found');
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId: 'nonexistent-board',
        cardId: 'card-1',
      }),
    ).rejects.toThrow('Board not found');
  });
});
