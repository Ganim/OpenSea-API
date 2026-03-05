import { describe, it, expect, beforeEach } from 'vitest';
import { CreateCommentUseCase } from './create-comment';
import { InMemoryCardsRepository } from '@/repositories/tasks/in-memory/in-memory-cards-repository';
import { InMemoryCardCommentsRepository } from '@/repositories/tasks/in-memory/in-memory-card-comments-repository';
import { InMemoryCardActivitiesRepository } from '@/repositories/tasks/in-memory/in-memory-card-activities-repository';

let cardsRepository: InMemoryCardsRepository;
let cardCommentsRepository: InMemoryCardCommentsRepository;
let cardActivitiesRepository: InMemoryCardActivitiesRepository;
let sut: CreateCommentUseCase;

describe('CreateCommentUseCase', () => {
  let boardId: string;
  let cardId: string;

  beforeEach(async () => {
    cardsRepository = new InMemoryCardsRepository();
    cardCommentsRepository = new InMemoryCardCommentsRepository();
    cardActivitiesRepository = new InMemoryCardActivitiesRepository();
    sut = new CreateCommentUseCase(
      cardsRepository,
      cardCommentsRepository,
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

  it('should create a comment on a card', async () => {
    const { comment } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      content: 'This is a comment',
    });

    expect(comment.content).toBe('This is a comment');
    expect(comment.authorId).toBe('user-1');
    expect(comment.cardId).toBe(cardId);
    expect(cardCommentsRepository.items).toHaveLength(1);
  });

  it('should store mentions when provided', async () => {
    const { comment } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      content: 'Hey @user-2 and @user-3 check this out',
      mentions: ['user-2', 'user-3'],
    });

    expect(comment.mentions).toEqual(['user-2', 'user-3']);
  });

  it('should reject empty content', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        cardId,
        content: '',
      }),
    ).rejects.toThrow('Comment content is required');
  });

  it('should reject if card is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userName: 'João',
        boardId,
        cardId: 'nonexistent-card',
        content: 'A comment',
      }),
    ).rejects.toThrow('Card not found');
  });

  it('should record a COMMENTED activity', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userName: 'João',
      boardId,
      cardId,
      content: 'Nice work!',
    });

    expect(cardActivitiesRepository.items).toHaveLength(1);
    expect(cardActivitiesRepository.items[0].type).toBe('COMMENTED');
    expect(cardActivitiesRepository.items[0].description).toBe(
      'João comentou no cartão Test Card',
    );
  });
});
