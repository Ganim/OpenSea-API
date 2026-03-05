import { describe, it, expect, beforeEach } from 'vitest';
import { AddReactionUseCase } from './add-reaction';
import { InMemoryCardCommentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-comments-repository';
import { InMemoryCommentReactionsRepository } from '@/repositories/tasks/in-memory/in-memory-comment-reactions-repository';

let cardCommentsRepository: InMemoryCardCommentsRepository;
let commentReactionsRepository: InMemoryCommentReactionsRepository;
let sut: AddReactionUseCase;

describe('AddReactionUseCase', () => {
  let commentId: string;
  const cardId = 'card-1';

  beforeEach(async () => {
    cardCommentsRepository = new InMemoryCardCommentsRepository();
    commentReactionsRepository = new InMemoryCommentReactionsRepository();
    sut = new AddReactionUseCase(
      cardCommentsRepository,
      commentReactionsRepository,
    );

    const comment = await cardCommentsRepository.create({
      cardId,
      authorId: 'user-1',
      content: 'A comment to react to',
    });

    commentId = comment.id;
  });

  it('should add a reaction to a comment', async () => {
    const { reaction } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-2',
      commentId,
      cardId,
      emoji: '👍',
    });

    expect(reaction.emoji).toBe('👍');
    expect(reaction.userId).toBe('user-2');
    expect(reaction.commentId).toBe(commentId);
    expect(commentReactionsRepository.items).toHaveLength(1);
  });

  it('should reject duplicate reaction from same user with same emoji', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-2',
      commentId,
      cardId,
      emoji: '👍',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        commentId,
        cardId,
        emoji: '👍',
      }),
    ).rejects.toThrow(
      'You have already reacted with this emoji on this comment',
    );
  });

  it('should allow same emoji from different users', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-2',
      commentId,
      cardId,
      emoji: '👍',
    });

    const { reaction } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-3',
      commentId,
      cardId,
      emoji: '👍',
    });

    expect(reaction.userId).toBe('user-3');
    expect(commentReactionsRepository.items).toHaveLength(2);
  });

  it('should reject if comment is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        commentId: 'nonexistent-comment',
        cardId,
        emoji: '👍',
      }),
    ).rejects.toThrow('Comment not found');
  });
});
