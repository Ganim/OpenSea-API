import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCommentUseCase } from './delete-comment';
import { InMemoryCardCommentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-comments-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardCommentsRepository: InMemoryCardCommentsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: DeleteCommentUseCase;

describe('DeleteCommentUseCase', () => {
  let commentId: string;
  const cardId = 'card-1';
  const boardId = 'board-1';

  beforeEach(async () => {
    cardCommentsRepository = new InMemoryCardCommentsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new DeleteCommentUseCase(
      cardCommentsRepository,
      cardsRepository,
      cardActivitiesRepository,
    );

    await cardsRepository.create({
      boardId,
      columnId: 'column-1',
      title: 'Test Card',
      reporterId: 'user-1',
      position: 0,
    });

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
      userName: 'User 1',
      boardId,
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
        userName: 'User 2',
        boardId,
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
        userName: 'User 1',
        boardId,
        commentId: 'nonexistent-comment',
        cardId,
      }),
    ).rejects.toThrow('Comment not found');
  });
});
