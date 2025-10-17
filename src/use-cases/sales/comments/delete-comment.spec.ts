import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import { InMemoryCommentsRepository } from '@/repositories/sales/in-memory/in-memory-comments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteCommentUseCase } from './delete-comment';

let commentsRepository: InMemoryCommentsRepository;
let sut: DeleteCommentUseCase;

describe('DeleteCommentUseCase', () => {
  beforeEach(() => {
    commentsRepository = new InMemoryCommentsRepository();
    sut = new DeleteCommentUseCase(commentsRepository);
  });

  it('should be able to delete a comment', async () => {
    const comment = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Test comment',
    });

    commentsRepository.items.push(comment);

    const result = await sut.execute({
      id: comment.id.toString(),
      authorId: 'user-1',
    });

    expect(result.comment.isDeleted).toBe(true);
  });

  it('should not be able to delete nonexistent comment', async () => {
    await expect(
      sut.execute({
        id: 'nonexistent-id',
        authorId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to delete comment from another author', async () => {
    const comment = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Test comment',
    });

    commentsRepository.items.push(comment);

    await expect(
      sut.execute({
        id: comment.id.toString(),
        authorId: 'user-2',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
