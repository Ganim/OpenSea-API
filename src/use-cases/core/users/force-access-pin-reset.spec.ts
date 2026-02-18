import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { ForceAccessPinResetUseCase } from './force-access-pin-reset';

let usersRepository: InMemoryUsersRepository;
let sut: ForceAccessPinResetUseCase;

describe('ForceAccessPinResetUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new ForceAccessPinResetUseCase(usersRepository);
  });

  it('should force access PIN reset successfully', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    const result = await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
    });

    expect(result.user).toBeDefined();
    expect(result.message).toContain('successfully');

    const updatedUser = await usersRepository.findById(
      new UniqueEntityID(target.id),
    );
    expect(updatedUser?.forceAccessPinSetup).toBe(true);
  });

  it('should throw ResourceNotFoundError if target user not found', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    await expect(() =>
      sut.execute({
        targetUserId: 'non-existent-id',
        requestedByUserId: admin.id,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError if target user is deleted', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    // Soft delete the target user
    const targetUser = await usersRepository.findById(
      new UniqueEntityID(target.id),
    );
    if (targetUser) targetUser.deletedAt = new Date();

    await expect(() =>
      sut.execute({
        targetUserId: target.id,
        requestedByUserId: admin.id,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if requester not found', async () => {
    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    await expect(() =>
      sut.execute({
        targetUserId: target.id,
        requestedByUserId: 'non-existent-admin',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
