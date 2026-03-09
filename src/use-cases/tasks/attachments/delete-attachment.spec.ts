import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteAttachmentUseCase } from './delete-attachment';
import { InMemoryBoardsRepository } from '@/repositories/tasks/in-memory/in-memory-boards-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardAttachmentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-attachments-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let boardsRepository: InMemoryBoardsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardAttachmentsRepository: InMemoryCardAttachmentsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: DeleteAttachmentUseCase;

describe('DeleteAttachmentUseCase', () => {
  let boardId: string;
  let cardId: string;
  let attachmentId: string;

  beforeEach(async () => {
    boardsRepository = new InMemoryBoardsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardAttachmentsRepository = new InMemoryCardAttachmentsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new DeleteAttachmentUseCase(
      boardsRepository,
      cardsRepository,
      cardAttachmentsRepository,
      cardActivitiesRepository,
    );

    const board = await boardsRepository.create({
      tenantId: 'tenant-1',
      title: 'Board 1',
      type: 'KANBAN',
      ownerId: 'user-1',
      position: 0,
    });

    boardId = board.id.toString();

    const card = await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
      position: 0,
    });

    cardId = card.id.toString();

    const attachment = await cardAttachmentsRepository.create({
      cardId,
      fileId: 'file-123',
      addedBy: 'user-1',
    });

    attachmentId = attachment.id;
  });

  it('should delete an attachment from a card', async () => {
    const { deletedAttachment } = await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      cardId,
      attachmentId,
      userId: 'user-1',
      userName: 'João',
    });

    expect(deletedAttachment.fileId).toBe('file-123');
    expect(cardAttachmentsRepository.items).toHaveLength(0);
  });

  it('should reject if attachment is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId,
        cardId,
        attachmentId: 'nonexistent-attachment',
        userId: 'user-1',
        userName: 'João',
      }),
    ).rejects.toThrow('Attachment not found');
  });

  it('should reject if card is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId,
        cardId: 'nonexistent-card',
        attachmentId,
        userId: 'user-1',
        userName: 'João',
      }),
    ).rejects.toThrow('Card not found');
  });

  it('should record an ATTACHMENT_REMOVED activity', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      boardId,
      cardId,
      attachmentId,
      userId: 'user-1',
      userName: 'João',
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    expect(cardActivitiesRepository.items[0].type).toBe('ATTACHMENT_REMOVED');
    expect(cardActivitiesRepository.items[0].description).toBe(
      'João removeu um anexo do cartão Test Card',
    );
  });

  it('should reject if board does not belong to tenant (cross-tenant isolation)', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-other',
        boardId,
        cardId,
        attachmentId,
        userId: 'user-1',
        userName: 'João',
      }),
    ).rejects.toThrow('Board not found');
  });

  it('should reject if board does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        boardId: 'nonexistent-board',
        cardId,
        attachmentId,
        userId: 'user-1',
        userName: 'João',
      }),
    ).rejects.toThrow('Board not found');
  });
});
