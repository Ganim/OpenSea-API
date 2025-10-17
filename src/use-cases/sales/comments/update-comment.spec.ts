import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import { InMemoryCommentsRepository } from '@/repositories/sales/in-memory/in-memory-comments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateCommentUseCase } from './update-comment';

let commentsRepository: InMemoryCommentsRepository;
let sut: UpdateCommentUseCase;

describe('UpdateCommentUseCase', () => {
  beforeEach(() => {
    commentsRepository = new InMemoryCommentsRepository();
    sut = new UpdateCommentUseCase(commentsRepository);
  });

  it('should be able to update a comment', async () => {
    const comment = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Original content',
    });

    commentsRepository.items.push(comment);

    const result = await sut.execute({
      id: comment.id.toString(),
      authorId: 'user-1',
      content: 'Updated content',
    });

    expect(result.comment.content).toBe('Updated content');
    expect(result.comment.isEdited).toBe(true);
  });

  it('should not be able to update nonexistent comment', async () => {
    await expect(
      sut.execute({
        id: 'nonexistent-id',
        authorId: 'user-1',
        content: 'Updated content',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to update comment from another author', async () => {
    const comment = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Original content',
    });

    commentsRepository.items.push(comment);

    await expect(
      sut.execute({
        id: comment.id.toString(),
        authorId: 'user-2', // Different author
        content: 'Updated content',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should not be able to update with empty content', async () => {
    const comment = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Original content',
    });

    commentsRepository.items.push(comment);

    await expect(
      sut.execute({
        id: comment.id.toString(),
        authorId: 'user-1',
        content: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
