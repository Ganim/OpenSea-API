import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCommentUseCase } from './update-comment';
import { InMemoryCardCommentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-comments-repository';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardCommentsRepository: InMemoryCardCommentsRepository;
let cardsRepository: InMemoryCardsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: UpdateCommentUseCase;

describe('UpdateCommentUseCase', () => {
  let commentId: string;
  const cardId = 'card-1';
  const boardId = 'board-1';

  beforeEach(async () => {
    cardCommentsRepository = new InMemoryCardCommentsRepository();
    cardsRepository = new InMemoryCardsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new UpdateCommentUseCase(
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
      content: 'Original content',
    });

    commentId = comment.id;
  });

  it('should update own comment content', async () => {
    const { comment } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'User 1',
      boardId,
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
        userName: 'User 2',
        boardId,
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
        userName: 'User 1',
        boardId,
        commentId: 'nonexistent-comment',
        cardId,
        content: 'Update',
      }),
    ).rejects.toThrow('Comment not found');
  });
});
