import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveReactionUseCase } from './remove-reaction';
import { InMemoryCommentReactionsRepository } from '@/repositories/tasks/in-memory/in-memory-comment-reactions-repository';

let commentReactionsRepository: InMemoryCommentReactionsRepository;
let sut: RemoveReactionUseCase;

describe('RemoveReactionUseCase', () => {
  beforeEach(() => {
    commentReactionsRepository = new InMemoryCommentReactionsRepository();
    sut = new RemoveReactionUseCase(commentReactionsRepository);
  });

  it('should remove an existing reaction', async () => {
    await commentReactionsRepository.create({
      commentId: 'comment-1',
      userId: 'user-1',
      emoji: '👍',
    });

    expect(commentReactionsRepository.items).toHaveLength(1);

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      commentId: 'comment-1',
      emoji: '👍',
    });

    expect(commentReactionsRepository.items).toHaveLength(0);
  });

  it('should reject if reaction is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        commentId: 'comment-1',
        emoji: '👍',
      }),
    ).rejects.toThrow('Reaction not found');
  });
});
