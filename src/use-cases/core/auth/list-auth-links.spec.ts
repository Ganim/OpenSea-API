import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAuthLinksUseCase } from './list-auth-links';

let authLinksRepository: InMemoryAuthLinksRepository;
let sut: ListAuthLinksUseCase;

describe('ListAuthLinksUseCase', () => {
  beforeEach(() => {
    authLinksRepository = new InMemoryAuthLinksRepository();
    sut = new ListAuthLinksUseCase(authLinksRepository);
  });

  it('should list all auth links for a user', async () => {
    const userId = new UniqueEntityID();

    await authLinksRepository.create({
      userId,
      provider: 'EMAIL',
      identifier: 'user@example.com',
      credential: 'hashed-pass',
    });

    await authLinksRepository.create({
      userId,
      provider: 'CPF',
      identifier: '12345678901',
    });

    const result = await sut.execute({ userId });

    expect(result.authLinks).toHaveLength(2);
    expect(result.authLinks[0].provider).toBe('EMAIL');
    expect(result.authLinks[1].provider).toBe('CPF');
  });

  it('should return empty array when user has no auth links', async () => {
    const userId = new UniqueEntityID();

    const result = await sut.execute({ userId });

    expect(result.authLinks).toHaveLength(0);
  });

  it('should not include auth links from other users', async () => {
    const userId1 = new UniqueEntityID();
    const userId2 = new UniqueEntityID();

    await authLinksRepository.create({
      userId: userId1,
      provider: 'EMAIL',
      identifier: 'user1@example.com',
    });

    await authLinksRepository.create({
      userId: userId2,
      provider: 'EMAIL',
      identifier: 'user2@example.com',
    });

    const result = await sut.execute({ userId: userId1 });

    expect(result.authLinks).toHaveLength(1);
    expect(result.authLinks[0].userId).toBe(userId1.toString());
  });
});
