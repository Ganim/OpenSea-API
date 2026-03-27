import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UserBlockedError } from '@/@errors/use-cases/user-blocked-error';
import { MAX_ATTEMPTS } from '@/config/auth';
import { Password } from '@/entities/core/value-objects/password';
import { InMemoryAuthLinksRepository } from '@/repositories/core/in-memory/in-memory-auth-links-repository';
import { InMemoryRefreshTokensRepository } from '@/repositories/core/in-memory/in-memory-refresh-tokens-repository';
import { InMemorySessionsRepository } from '@/repositories/core/in-memory/in-memory-sessions-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { faker } from '@faker-js/faker/locale/en';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSessionUseCase } from '../sessions/create-session';
import { AuthenticateUnifiedUseCase } from './authenticate-unified';

let authLinksRepository: InMemoryAuthLinksRepository;
let usersRepository: InMemoryUsersRepository;
let sessionsRepository: InMemorySessionsRepository;
let refreshTokensRepository: InMemoryRefreshTokensRepository;
let createSessionUseCase: CreateSessionUseCase;
let sut: AuthenticateUnifiedUseCase;
let reply: { jwtSign: () => Promise<string> };

describe('Authenticate Unified Use Case', () => {
  beforeEach(() => {
    authLinksRepository = new InMemoryAuthLinksRepository();
    usersRepository = new InMemoryUsersRepository();
    sessionsRepository = new InMemorySessionsRepository();
    refreshTokensRepository = new InMemoryRefreshTokensRepository();
    reply = {
      jwtSign: async () => faker.internet.jwt(),
    };
    createSessionUseCase = new CreateSessionUseCase(
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
    );
    sut = new AuthenticateUnifiedUseCase(
      authLinksRepository,
      usersRepository,
      createSessionUseCase,
    );
  });

  it('should authenticate with email + password via AuthLink', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const hashedPassword = await Password.hash('Pass@123');

    await authLinksRepository.create({
      userId: usersRepository['items'][0].id,
      provider: 'EMAIL',
      identifier: 'johndoe@example.com',
      credential: hashedPassword.toString(),
    });

    const result = await sut.execute({
      identifier: 'johndoe@example.com',
      password: 'Pass@123',
      ip: '127.0.0.1',
      reply: reply as unknown as import('fastify').FastifyReply,
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('johndoe@example.com');
    expect(result.sessionId).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should authenticate with CPF + password via AuthLink', async () => {
    const { user } = await makeUser({
      email: 'cpfuser@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const hashedPassword = await Password.hash('Pass@123');

    await authLinksRepository.create({
      userId: usersRepository['items'][0].id,
      provider: 'CPF',
      identifier: '12345678901',
      credential: hashedPassword.toString(),
    });

    const result = await sut.execute({
      identifier: '123.456.789-01',
      password: 'Pass@123',
      ip: '127.0.0.1',
      reply: reply as unknown as import('fastify').FastifyReply,
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('cpfuser@example.com');
  });

  it('should reject inactive auth link', async () => {
    await makeUser({
      email: 'inactive@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const hashedPassword = await Password.hash('Pass@123');

    await authLinksRepository.create({
      userId: usersRepository['items'][0].id,
      provider: 'EMAIL',
      identifier: 'inactive@example.com',
      credential: hashedPassword.toString(),
      status: 'INACTIVE',
    });

    await expect(
      sut.execute({
        identifier: 'inactive@example.com',
        password: 'Pass@123',
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should reject wrong password and increment failed attempts', async () => {
    await makeUser({
      email: 'wrongpw@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const hashedPassword = await Password.hash('Pass@123');

    await authLinksRepository.create({
      userId: usersRepository['items'][0].id,
      provider: 'EMAIL',
      identifier: 'wrongpw@example.com',
      credential: hashedPassword.toString(),
    });

    await expect(
      sut.execute({
        identifier: 'wrongpw@example.com',
        password: 'wrongpassword',
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toThrow(BadRequestError);

    const updatedUser = usersRepository['items'][0];
    expect(updatedUser.failedLoginAttempts).toBe(1);
  });

  it('should reject non-existent identifier', async () => {
    await expect(
      sut.execute({
        identifier: 'notfound@example.com',
        password: 'Pass@123',
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should block after max failed attempts', async () => {
    await makeUser({
      email: 'blockme@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const hashedPassword = await Password.hash('Pass@123');

    await authLinksRepository.create({
      userId: usersRepository['items'][0].id,
      provider: 'EMAIL',
      identifier: 'blockme@example.com',
      credential: hashedPassword.toString(),
    });

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await expect(
        sut.execute({
          identifier: 'blockme@example.com',
          password: 'wrongpassword',
          ip: '127.0.0.1',
          reply: reply as unknown as import('fastify').FastifyReply,
        }),
      ).rejects.toSatisfy(
        (error: unknown) =>
          error instanceof BadRequestError || error instanceof UserBlockedError,
      );
    }

    await expect(
      sut.execute({
        identifier: 'blockme@example.com',
        password: 'Pass@123',
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toThrow(UserBlockedError);
  });

  it('should update lastUsedAt on success', async () => {
    await makeUser({
      email: 'lastused@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const hashedPassword = await Password.hash('Pass@123');

    const authLink = await authLinksRepository.create({
      userId: usersRepository['items'][0].id,
      provider: 'EMAIL',
      identifier: 'lastused@example.com',
      credential: hashedPassword.toString(),
    });

    expect(authLink.lastUsedAt).toBeNull();

    await sut.execute({
      identifier: 'lastused@example.com',
      password: 'Pass@123',
      ip: '127.0.0.1',
      reply: reply as unknown as import('fastify').FastifyReply,
    });

    const updated = await authLinksRepository.findById(authLink.id);
    expect(updated!.lastUsedAt).toBeInstanceOf(Date);
  });

  it('should handle forcePasswordReset', async () => {
    await makeUser({
      email: 'forcereset@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];
    user.forcePasswordReset = true;
    user.forcePasswordResetReason = 'Admin requested';

    const hashedPassword = await Password.hash('Pass@123');

    await authLinksRepository.create({
      userId: user.id,
      provider: 'EMAIL',
      identifier: 'forcereset@example.com',
      credential: hashedPassword.toString(),
    });

    await expect(
      sut.execute({
        identifier: 'forcereset@example.com',
        password: 'Pass@123',
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof ForbiddenError &&
        'code' in error &&
        (error as any).code === 'PASSWORD_RESET_REQUIRED'
      );
    });
  });
});
