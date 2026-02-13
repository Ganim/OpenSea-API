import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PinSetupRequiredError } from '@/@errors/use-cases/pin-setup-required-error';
import { InMemoryRefreshTokensRepository } from '@/repositories/core/in-memory/in-memory-refresh-tokens-repository';
import { InMemorySessionsRepository } from '@/repositories/core/in-memory/in-memory-sessions-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { faker } from '@faker-js/faker/locale/en';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSessionUseCase } from '../sessions/create-session';
import { AuthenticateWithAccessPinUseCase } from './authenticate-with-access-pin';
import { SetAccessPinUseCase } from './set-access-pin';

let usersRepository: InMemoryUsersRepository;
let sessionsRepository: InMemorySessionsRepository;
let refreshTokensRepository: InMemoryRefreshTokensRepository;
let createSessionUseCase: CreateSessionUseCase;
let authenticateWithAccessPinUseCase: AuthenticateWithAccessPinUseCase;
let setAccessPinUseCase: SetAccessPinUseCase;
let reply: { jwtSign: () => Promise<string> };

describe('Authenticate With Access PIN Use Case', () => {
  beforeEach(() => {
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
    authenticateWithAccessPinUseCase = new AuthenticateWithAccessPinUseCase(
      usersRepository,
      createSessionUseCase,
    );
    setAccessPinUseCase = new SetAccessPinUseCase(usersRepository);
  });

  it('should authenticate user with correct access PIN', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await setAccessPinUseCase.execute({
      userId: user.id,
      currentPassword: 'Pass@123',
      newAccessPin: '123456',
    });

    const result = await authenticateWithAccessPinUseCase.execute({
      userId: user.id,
      accessPin: '123456',
      ip: '127.0.0.1',
      reply: reply as unknown as import('fastify').FastifyReply,
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('johndoe@example.com');
    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should not authenticate with wrong PIN', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await setAccessPinUseCase.execute({
      userId: user.id,
      currentPassword: 'Pass@123',
      newAccessPin: '123456',
    });

    await expect(
      authenticateWithAccessPinUseCase.execute({
        userId: user.id,
        accessPin: '654321',
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw PinSetupRequiredError if user has no access PIN', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(
      authenticateWithAccessPinUseCase.execute({
        userId: user.id,
        accessPin: '123456',
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toBeInstanceOf(PinSetupRequiredError);
  });

  it('should not authenticate non-existent user', async () => {
    await expect(
      authenticateWithAccessPinUseCase.execute({
        userId: 'non-existent-id',
        accessPin: '123456',
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
