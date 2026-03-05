import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCommentUseCase } from './delete-comment';
import { InMemoryCardCommentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-comments-repository';

let cardCommentsRepository: InMemoryCardCommentsRepository;
let sut: DeleteCommentUseCase;

describe('DeleteCommentUseCase', () => {
  let commentId: string;
  const cardId = 'card-1';

  beforeEach(async () => {
    cardCommentsRepository = new InMemoryCardCommentsRepository();
    sut = new DeleteCommentUseCase(cardCommentsRepository);

    const comment = await cardCommentsRepository.create({
      cardId,
      authorId: 'user-1',
      content: 'Comment to delete',
    });

    commentId = comment.id;
  });

  it('should soft delete own comment', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      commentId,
      cardId,
    });

    const deletedComment = cardCommentsRepository.items.find(
      (c) => c.id === commentId,
    );

    expect(deletedComment?.deletedAt).toBeTruthy();

    // Should not appear in findById (excludes deleted)
    const foundComment = await cardCommentsRepository.findById(
      commentId,
      cardId,
    );
    expect(foundComment).toBeNull();
  });

  it('should reject if user is not the author', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        commentId,
        cardId,
      }),
    ).rejects.toThrow('Only the comment author can delete this comment');
  });

  it('should reject if comment is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        commentId: 'nonexistent-comment',
        cardId,
      }),
    ).rejects.toThrow('Comment not found');
  });
});
