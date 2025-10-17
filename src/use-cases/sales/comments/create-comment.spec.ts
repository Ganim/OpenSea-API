import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import { InMemoryCommentsRepository } from '@/repositories/sales/in-memory/in-memory-comments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCommentUseCase } from './create-comment';

let commentsRepository: InMemoryCommentsRepository;
let sut: CreateCommentUseCase;

describe('CreateCommentUseCase', () => {
  beforeEach(() => {
    commentsRepository = new InMemoryCommentsRepository();
    sut = new CreateCommentUseCase(commentsRepository);
  });

  it('should be able to create a comment', async () => {
    const result = await sut.execute({
      entityType: 'CUSTOMER',
      entityId: 'customer-1',
      authorId: 'user-1',
      content: 'This is a test comment',
    });

    expect(result.comment).toBeDefined();
    expect(result.comment.content).toBe('This is a test comment');
    expect(result.comment.entityType.value).toBe('CUSTOMER');
    expect(result.comment.isReply).toBe(false);
  });

  it('should be able to create a reply comment', async () => {
    const parentComment = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Parent comment',
    });

    commentsRepository.items.push(parentComment);

    const result = await sut.execute({
      entityType: 'CUSTOMER',
      entityId: 'customer-1',
      authorId: 'user-2',
      content: 'This is a reply',
      parentCommentId: parentComment.id.toString(),
    });

    expect(result.comment.isReply).toBe(true);
    expect(result.comment.parentCommentId?.equals(parentComment.id)).toBe(true);
  });

  it('should not be able to create a comment with empty content', async () => {
    await expect(
      sut.execute({
        entityType: 'CUSTOMER',
        entityId: 'customer-1',
        authorId: 'user-1',
        content: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a comment with content longer than 5000 characters', async () => {
    await expect(
      sut.execute({
        entityType: 'CUSTOMER',
        entityId: 'customer-1',
        authorId: 'user-1',
        content: 'a'.repeat(5001),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a comment with invalid entity type', async () => {
    await expect(
      sut.execute({
        entityType: 'INVALID',
        entityId: 'customer-1',
        authorId: 'user-1',
        content: 'Test comment',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to reply to nonexistent comment', async () => {
    await expect(
      sut.execute({
        entityType: 'CUSTOMER',
        entityId: 'customer-1',
        authorId: 'user-1',
        content: 'Reply to nonexistent',
        parentCommentId: 'nonexistent-comment-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to reply to comment from different entity', async () => {
    const parentComment = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Parent comment',
    });

    commentsRepository.items.push(parentComment);

    await expect(
      sut.execute({
        entityType: 'CUSTOMER',
        entityId: 'customer-2', // Different entity
        authorId: 'user-2',
        content: 'This is a reply',
        parentCommentId: parentComment.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should trim comment content', async () => {
    const result = await sut.execute({
      entityType: 'CUSTOMER',
      entityId: 'customer-1',
      authorId: 'user-1',
      content: '  Test comment with spaces  ',
    });

    expect(result.comment.content).toBe('Test comment with spaces');
  });
});
