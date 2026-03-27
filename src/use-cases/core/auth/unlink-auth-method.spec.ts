import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnlinkAuthMethodUseCase } from './unlink-auth-method';

let authLinksRepository: InMemoryAuthLinksRepository;
let usersRepository: InMemoryUsersRepository;
let sut: UnlinkAuthMethodUseCase;

describe('Unlink Auth Method Use Case', () => {
  beforeEach(() => {
    authLinksRepository = new InMemoryAuthLinksRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new UnlinkAuthMethodUseCase(authLinksRepository);
  });

  it('should unlink auth method', async () => {
    await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];

    // Create two active auth links so we can unlink one
    const authLink1 = await authLinksRepository.create({
      userId: user.id,
      provider: 'EMAIL',
      identifier: 'johndoe@example.com',
      credential: user.password,
    });

    await authLinksRepository.create({
      userId: user.id,
      provider: 'CPF',
      identifier: '12345678901',
      credential: user.password,
    });

    const result = await sut.execute({
      authLinkId: authLink1.id,
      userId: user.id,
    });

    expect(result.authLink).toBeDefined();
    expect(result.authLink.unlinkedAt).not.toBeNull();
  });

  it('should reject unlinking last active method (non-admin)', async () => {
    await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];

    // Create only one active auth link
    const authLink = await authLinksRepository.create({
      userId: user.id,
      provider: 'EMAIL',
      identifier: 'johndoe@example.com',
      credential: user.password,
    });

    await expect(
      sut.execute({
        authLinkId: authLink.id,
        userId: user.id,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow admin to unlink last method (override)', async () => {
    await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];

    // Create only one active auth link
    const authLink = await authLinksRepository.create({
      userId: user.id,
      provider: 'EMAIL',
      identifier: 'johndoe@example.com',
      credential: user.password,
    });

    const result = await sut.execute({
      authLinkId: authLink.id,
      userId: user.id,
      isAdmin: true,
    });

    expect(result.authLink).toBeDefined();
    expect(result.authLink.unlinkedAt).not.toBeNull();
  });
});
