import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { compare } from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChangeMyPasswordUseCase } from './change-my-password';

let usersRepository: InMemoryUsersRepository;
let authLinksRepository: InMemoryAuthLinksRepository;
let sut: ChangeMyPasswordUseCase;

describe('ChangeMyPasswordUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    authLinksRepository = new InMemoryAuthLinksRepository();
    sut = new ChangeMyPasswordUseCase(usersRepository, authLinksRepository);
  });

  // OBJECTIVE

  it('should change own password', async () => {
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

  // REJECTS

  it('should throw ResourceNotFoundError if user does not exist', async () => {
    await expect(() =>
      sut.execute({ userId: 'notfound', password: 'Wrong@123' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError if user is deleted', async () => {
    const { user } = await makeUser({
      email: 'deleted@example.com',
      password: 'Pass@123',
      deletedAt: new Date(),
      usersRepository,
    });
    await expect(() =>
      sut.execute({ userId: user.id, password: 'Wrong@123' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
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

    // AuthLink without credential (e.g., OAuth) should not be affected
    await authLinksRepository.create({
      userId,
      provider: 'GOOGLE',
      identifier: 'google-sub-id',
      credential: null,
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
    const googleLink = await authLinksRepository.findByUserIdAndProvider(
      userId,
      'GOOGLE',
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
    expect(googleLink?.credential).toBeNull();
  });

  // INTEGRATION

  it('should keep correct user count after password change', async () => {
    await makeUser({
      email: 'user1@example.com',
      password: 'Pass@123',
      usersRepository,
    });
    const { user } = await makeUser({
      email: 'user2@example.com',
      password: 'Pass@123',
      usersRepository,
    });
    await sut.execute({ userId: user.id, password: 'changedpass' });
    const allUsers = await usersRepository.listAll();
    expect(allUsers).toHaveLength(2);
  });
});
