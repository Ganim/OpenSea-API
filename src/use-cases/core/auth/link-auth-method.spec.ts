import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { Password } from '@/entities/core/value-objects/password';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { LinkAuthMethodUseCase } from './link-auth-method';

let authLinksRepository: InMemoryAuthLinksRepository;
let usersRepository: InMemoryUsersRepository;
let sut: LinkAuthMethodUseCase;

describe('Link Auth Method Use Case', () => {
  beforeEach(() => {
    authLinksRepository = new InMemoryAuthLinksRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new LinkAuthMethodUseCase(authLinksRepository, usersRepository);
  });

  it('should link CPF to user', async () => {
    await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];

    const result = await sut.execute({
      userId: user.id,
      provider: 'CPF',
      identifier: '123.456.789-01',
      currentPassword: 'Pass@123',
    });

    expect(result.authLink).toBeDefined();
    expect(result.authLink.provider).toBe('CPF');
    expect(result.authLink.hasCredential).toBe(true);
  });

  it('should reject if CPF already linked to another user', async () => {
    await makeUser({
      email: 'user1@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await makeUser({
      email: 'user2@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user1 = usersRepository['items'][0];
    const user2 = usersRepository['items'][1];

    // Link CPF to user1
    await authLinksRepository.create({
      userId: user1.id,
      provider: 'CPF',
      identifier: '12345678901',
      credential: await Password.hash('Pass@123').then((p) => p.toString()),
    });

    // Try to link same CPF to user2
    await expect(
      sut.execute({
        userId: user2.id,
        provider: 'CPF',
        identifier: '123.456.789-01',
        currentPassword: 'Pass@123',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should reject if wrong password', async () => {
    await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];

    await expect(
      sut.execute({
        userId: user.id,
        provider: 'CPF',
        identifier: '123.456.789-01',
        currentPassword: 'WrongPassword',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject if user already has that provider', async () => {
    await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];

    // Link CPF first time
    await authLinksRepository.create({
      userId: user.id,
      provider: 'CPF',
      identifier: '12345678901',
      credential: user.password,
    });

    // Try to link CPF again with different identifier
    await expect(
      sut.execute({
        userId: user.id,
        provider: 'CPF',
        identifier: '98765432100',
        currentPassword: 'Pass@123',
      }),
    ).rejects.toThrow(ConflictError);
  });
});
