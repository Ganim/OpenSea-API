import { describe, it, expect, beforeEach } from 'vitest';
import { ListAttachmentsUseCase } from './list-attachments';
import { InMemoryCardAttachmentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-attachments-repository';

let cardAttachmentsRepository: InMemoryCardAttachmentsRepository;
let sut: ListAttachmentsUseCase;

describe('ListAttachmentsUseCase', () => {
  beforeEach(() => {
    cardAttachmentsRepository = new InMemoryCardAttachmentsRepository();
    sut = new ListAttachmentsUseCase(cardAttachmentsRepository);
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

    const { attachments } = await sut.execute({ cardId: 'card-1' });

    expect(attachments).toHaveLength(2);
    expect(attachments[0].fileId).toBe('file-1');
    expect(attachments[1].fileId).toBe('file-2');
  });

  it('should return empty array when card has no attachments', async () => {
    const { attachments } = await sut.execute({ cardId: 'card-1' });

    expect(attachments).toHaveLength(0);
  });
});
