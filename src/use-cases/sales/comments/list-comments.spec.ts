import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import { InMemoryCommentsRepository } from '@/repositories/sales/in-memory/in-memory-comments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCommentsUseCase } from './list-comments';

let commentsRepository: InMemoryCommentsRepository;
let sut: ListCommentsUseCase;

describe('ListCommentsUseCase', () => {
  beforeEach(() => {
    commentsRepository = new InMemoryCommentsRepository();
    sut = new ListCommentsUseCase(commentsRepository);
  });

  it('should be able to list comments by entity', async () => {
    const comment1 = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Comment 1',
    });

    const comment2 = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-2'),
      content: 'Comment 2',
    });

    const comment3 = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-2'),
      userId: new UniqueEntityID('user-1'),
      content: 'Comment 3',
    });

    commentsRepository.items.push(comment1, comment2, comment3);

    const result = await sut.execute({
      entityType: 'CUSTOMER',
      entityId: 'customer-1',
    });

    expect(result.comments).toHaveLength(2);
    expect(result.comments).toContainEqual(comment1);
    expect(result.comments).toContainEqual(comment2);
  });

  it('should be able to list comments by author', async () => {
    const comment1 = Comment.create({
      entityType: EntityType.create('CUSTOMER'),
      entityId: new UniqueEntityID('customer-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Comment 1',
    });

    const comment2 = Comment.create({
      entityType: EntityType.create('PRODUCT'),
      entityId: new UniqueEntityID('product-1'),
      userId: new UniqueEntityID('user-1'),
      content: 'Comment 2',
    });

    commentsRepository.items.push(comment1, comment2);

    const result = await sut.execute({
      authorId: 'user-1',
    });

    expect(result.comments).toHaveLength(2);
  });
});
