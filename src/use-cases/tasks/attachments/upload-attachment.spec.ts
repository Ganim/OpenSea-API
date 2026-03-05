import { describe, it, expect, beforeEach } from 'vitest';
import { UploadAttachmentUseCase } from './upload-attachment';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardAttachmentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-attachments-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardsRepository: InMemoryCardsRepository;
let cardAttachmentsRepository: InMemoryCardAttachmentsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: UploadAttachmentUseCase;

describe('UploadAttachmentUseCase', () => {
  let boardId: string;
  let cardId: string;

  beforeEach(async () => {
    cardsRepository = new InMemoryCardsRepository();
    cardAttachmentsRepository = new InMemoryCardAttachmentsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new UploadAttachmentUseCase(
      cardsRepository,
      cardAttachmentsRepository,
      cardActivitiesRepository,
    );

    const card = await cardsRepository.create({
      boardId: 'board-1',
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
      position: 0,
    });

    boardId = card.boardId.toString();
    cardId = card.id.toString();
  });

  it('should upload an attachment to a card', async () => {
    const { attachment } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      fileId: 'file-123',
      fileName: 'document.pdf',
    });

    expect(attachment.fileId).toBe('file-123');
    expect(attachment.addedBy).toBe('user-1');
    expect(attachment.cardId).toBe(cardId);
    expect(cardAttachmentsRepository.items).toHaveLength(1);
  });

  it('should reject if card is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        cardId: 'nonexistent-card',
        fileId: 'file-123',
        fileName: 'document.pdf',
      }),
    ).rejects.toThrow('Card not found');
  });

  it('should record an ATTACHMENT_ADDED activity', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      fileId: 'file-123',
      fileName: 'document.pdf',
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    expect(cardActivitiesRepository.items[0].type).toBe('ATTACHMENT_ADDED');
    expect(cardActivitiesRepository.items[0].description).toBe(
      'João anexou document.pdf ao cartão Test Card',
    );
  });
});
