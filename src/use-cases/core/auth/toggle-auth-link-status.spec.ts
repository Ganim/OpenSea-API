import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToggleAuthLinkStatusUseCase } from './toggle-auth-link-status';

let authLinksRepository: InMemoryAuthLinksRepository;
let sut: ToggleAuthLinkStatusUseCase;

describe('ToggleAuthLinkStatusUseCase', () => {
  beforeEach(() => {
    authLinksRepository = new InMemoryAuthLinksRepository();
    sut = new ToggleAuthLinkStatusUseCase(authLinksRepository);
  });

  it('should activate an inactive auth link', async () => {
    const userId = new UniqueEntityID();

    const authLink = await authLinksRepository.create({
      userId,
      provider: 'EMAIL',
      identifier: 'user@example.com',
      credential: 'hash',
      status: 'INACTIVE',
    });

    const result = await sut.execute({
      authLinkId: authLink.id,
      userId,
      newStatus: 'ACTIVE',
    });

    expect(result.authLink.status).toBe('ACTIVE');
  });

  it('should deactivate an auth link when user has multiple active links', async () => {
    const userId = new UniqueEntityID();

    const authLink1 = await authLinksRepository.create({
      userId,
      provider: 'EMAIL',
      identifier: 'user@example.com',
      credential: 'hash',
      status: 'ACTIVE',
    });

    await authLinksRepository.create({
      userId,
      provider: 'CPF',
      identifier: '12345678901',
      status: 'ACTIVE',
    });

    const result = await sut.execute({
      authLinkId: authLink1.id,
      userId,
      newStatus: 'INACTIVE',
    });

    expect(result.authLink.status).toBe('INACTIVE');
  });

  it('should throw BadRequestError when auth link is not found', async () => {
    await expect(
      sut.execute({
        authLinkId: new UniqueEntityID(),
        userId: new UniqueEntityID(),
        newStatus: 'ACTIVE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw ForbiddenError when user does not own the auth link', async () => {
    const ownerId = new UniqueEntityID();
    const otherUserId = new UniqueEntityID();

    const authLink = await authLinksRepository.create({
      userId: ownerId,
      provider: 'EMAIL',
      identifier: 'owner@example.com',
      credential: 'hash',
    });

    await expect(
      sut.execute({
        authLinkId: authLink.id,
        userId: otherUserId,
        newStatus: 'INACTIVE',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw BadRequestError when deactivating last active method (non-admin)', async () => {
    const userId = new UniqueEntityID();

    const authLink = await authLinksRepository.create({
      userId,
      provider: 'EMAIL',
      identifier: 'user@example.com',
      credential: 'hash',
      status: 'ACTIVE',
    });

    await expect(
      sut.execute({
        authLinkId: authLink.id,
        userId,
        newStatus: 'INACTIVE',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow admin to deactivate last active method', async () => {
    const userId = new UniqueEntityID();

    const authLink = await authLinksRepository.create({
      userId,
      provider: 'EMAIL',
      identifier: 'user@example.com',
      credential: 'hash',
      status: 'ACTIVE',
    });

    const result = await sut.execute({
      authLinkId: authLink.id,
      userId,
      newStatus: 'INACTIVE',
      isAdmin: true,
    });

    expect(result.authLink.status).toBe('INACTIVE');
  });

  it('should allow admin to modify another user auth link', async () => {
    const ownerId = new UniqueEntityID();
    const adminId = new UniqueEntityID();

    const authLink = await authLinksRepository.create({
      userId: ownerId,
      provider: 'EMAIL',
      identifier: 'owner@example.com',
      credential: 'hash',
      status: 'ACTIVE',
    });

    // Add a second link so it's not the last
    await authLinksRepository.create({
      userId: ownerId,
      provider: 'CPF',
      identifier: '12345678901',
      status: 'ACTIVE',
    });

    const result = await sut.execute({
      authLinkId: authLink.id,
      userId: adminId,
      newStatus: 'INACTIVE',
      isAdmin: true,
    });

    expect(result.authLink.status).toBe('INACTIVE');
  });
});
