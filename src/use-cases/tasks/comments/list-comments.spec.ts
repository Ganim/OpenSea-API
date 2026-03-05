import { describe, it, expect, beforeEach } from 'vitest';
import { ListCommentsUseCase } from './list-comments';
import { InMemoryCardCommentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-comments-repository';

let cardCommentsRepository: InMemoryCardCommentsRepository;
let sut: ListCommentsUseCase;

describe('ListCommentsUseCase', () => {
  const cardId = 'card-1';

  beforeEach(async () => {
    cardCommentsRepository = new InMemoryCardCommentsRepository();
    sut = new ListCommentsUseCase(cardCommentsRepository);
  });

  it('should list comments for a card sorted by newest first', async () => {
    const firstComment = await cardCommentsRepository.create({
      cardId,
      authorId: 'user-1',
      content: 'First comment',
    });

    // Manually set an older date so sorting is deterministic
    firstComment.createdAt = new Date('2026-01-01T00:00:00Z');

    const secondComment = await cardCommentsRepository.create({
      cardId,
      authorId: 'user-2',
      content: 'Second comment',
    });

    secondComment.createdAt = new Date('2026-01-02T00:00:00Z');

    const { comments, total } = await sut.execute({
      tenantId: 'tenant-1',
      cardId,
    });

    expect(total).toBe(2);
    expect(comments).toHaveLength(2);
    // Newest first
    expect(comments[0].content).toBe('Second comment');
    expect(comments[1].content).toBe('First comment');
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await cardCommentsRepository.create({
        cardId,
        authorId: 'user-1',
        content: `Comment ${i + 1}`,
      });
    }

    const firstPage = await sut.execute({
      tenantId: 'tenant-1',
      cardId,
      page: 1,
      limit: 2,
    });

    expect(firstPage.total).toBe(5);
    expect(firstPage.comments).toHaveLength(2);

    const secondPage = await sut.execute({
      tenantId: 'tenant-1',
      cardId,
      page: 2,
      limit: 2,
    });

    expect(secondPage.comments).toHaveLength(2);
  });

  it('should return empty list when no comments exist', async () => {
    const { comments, total } = await sut.execute({
      tenantId: 'tenant-1',
      cardId: 'card-with-no-comments',
    });

    expect(total).toBe(0);
    expect(comments).toHaveLength(0);
  });

  it('should exclude deleted comments', async () => {
    const comment = await cardCommentsRepository.create({
      cardId,
      authorId: 'user-1',
      content: 'Will be deleted',
    });

    await cardCommentsRepository.create({
      cardId,
      authorId: 'user-1',
      content: 'Will remain',
    });

    await cardCommentsRepository.softDelete(comment.id, cardId);

    const { comments, total } = await sut.execute({
      tenantId: 'tenant-1',
      cardId,
    });

    expect(total).toBe(1);
    expect(comments[0].content).toBe('Will remain');
  });
});
