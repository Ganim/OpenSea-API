import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCommentUseCase } from './update-comment';
import { InMemoryCardCommentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-comments-repository';

let cardCommentsRepository: InMemoryCardCommentsRepository;
let sut: UpdateCommentUseCase;

describe('UpdateCommentUseCase', () => {
  let commentId: string;
  const cardId = 'card-1';

  beforeEach(async () => {
    cardCommentsRepository = new InMemoryCardCommentsRepository();
    sut = new UpdateCommentUseCase(cardCommentsRepository);

    const comment = await cardCommentsRepository.create({
      cardId,
      authorId: 'user-1',
      content: 'Original content',
    });

    commentId = comment.id;
  });

  it('should update own comment content', async () => {
    const { comment } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      commentId,
      cardId,
      content: 'Updated content',
    });

    expect(comment.content).toBe('Updated content');
    expect(comment.editedAt).toBeTruthy();
  });

  it('should reject if user is not the author', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        commentId,
        cardId,
        content: 'Trying to edit',
      }),
    ).rejects.toThrow('Only the comment author can edit this comment');
  });

  it('should reject if comment is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        commentId: 'nonexistent-comment',
        cardId,
        content: 'Update',
      }),
    ).rejects.toThrow('Comment not found');
  });
});
