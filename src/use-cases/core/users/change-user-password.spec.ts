import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { compare } from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChangeUserPasswordUseCase } from './change-user-password';

let usersRepository: InMemoryUsersRepository;
let authLinksRepository: InMemoryAuthLinksRepository;
let sut: ChangeUserPasswordUseCase;

describe('ChangeUserPasswordUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    authLinksRepository = new InMemoryAuthLinksRepository();
    sut = new ChangeUserPasswordUseCase(usersRepository, authLinksRepository);
  });

  // OBJECTIVE
  it('should change user password', async () => {
    const { user } = await makeUser({
      email: 'user@example.com',
      password: 'oldpass',
      usersRepository,
    });
    await sut.execute({ userId: user.id, password: 'newpass' });

    const userId = new UniqueEntityID(user.id);
    const updatedUser = await usersRepository.findById(userId);

    const isPasswordHashed = await compare(
      'newpass',
      updatedUser?.password.toString() ?? '',
    );
    expect(isPasswordHashed).toBe(true);
  });

  it('should sync credentials across AuthLinks with credentials on password change', async () => {
    const { user } = await makeUser({
      email: 'user@example.com',
      password: 'oldpass',
      usersRepository,
    });

    const userId = new UniqueEntityID(user.id);

    await authLinksRepository.create({
      userId,
      provider: 'EMAIL',
      identifier: 'user@example.com',
      credential: 'old-hash',
    });

    await authLinksRepository.create({
      userId,
      provider: 'CPF',
      identifier: '12345678900',
      credential: 'old-hash',
    });

    await sut.execute({ userId: user.id, password: 'newpass' });

    const emailLink = await authLinksRepository.findByUserIdAndProvider(
      userId,
      'EMAIL',
    );
    const cpfLink = await authLinksRepository.findByUserIdAndProvider(
      userId,
      'CPF',
    );

    const isEmailLinkUpdated = await compare(
      'newpass',
      emailLink?.credential ?? '',
    );
    const isCpfLinkUpdated = await compare(
      'newpass',
      cpfLink?.credential ?? '',
    );

    expect(isEmailLinkUpdated).toBe(true);
    expect(isCpfLinkUpdated).toBe(true);
  });

  // REJECTS

  it('should throw ResourceNotFoundError if user not found', async () => {
    await expect(() =>
      sut.execute({ userId: 'notfound', password: 'Wrong@123' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow password change for deleted user', async () => {
    const { user } = await makeUser({
      email: 'deleted@example.com',
      password: 'oldpass',
      usersRepository,
    });
    const userId = new UniqueEntityID(user.id);
    const storedUser = await usersRepository.findById(userId);
    if (storedUser) storedUser.deletedAt = new Date();
    await expect(() =>
      sut.execute({ userId: user.id, password: 'newpass' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
