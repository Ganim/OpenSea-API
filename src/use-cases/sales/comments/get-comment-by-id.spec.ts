import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import { InMemoryCommentsRepository } from '@/repositories/sales/in-memory/in-memory-comments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCommentByIdUseCase } from './get-comment-by-id';

let commentsRepository: InMemoryCommentsRepository;
let sut: GetCommentByIdUseCase;

describe('GetCommentByIdUseCase', () => {
  beforeEach(() => {
    commentsRepository = new InMemoryCommentsRepository();
    sut = new GetCommentByIdUseCase(commentsRepository);
  });

  it('should be able to get a comment by id', async () => {
    const comment = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Test comment',
    });

    commentsRepository.items.push(comment);

    const result = await sut.execute({
      id: comment.id.toString(),
    });

    expect(result.comment.id).toBe(comment.id.toString());
    expect(result.comment.content).toBe('Test comment');
    expect(result.comment.entityType).toBe('CUSTOMER');
  });

  it('should not be able to get nonexistent comment', async () => {
    await expect(
      sut.execute({
        id: 'nonexistent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
