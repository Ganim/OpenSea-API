import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryMagicLinkTokensRepository } from '@/repositories/core/in-memory/in-memory-magic-link-tokens-repository';
import { InMemoryRefreshTokensRepository } from '@/repositories/core/in-memory/in-memory-refresh-tokens-repository';
import { InMemorySessionsRepository } from '@/repositories/core/in-memory/in-memory-sessions-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { faker } from '@faker-js/faker/locale/en';
import crypto from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSessionUseCase } from '../sessions/create-session';
import { VerifyMagicLinkUseCase } from './verify-magic-link';

let magicLinkTokensRepository: InMemoryMagicLinkTokensRepository;
let usersRepository: InMemoryUsersRepository;
let sessionsRepository: InMemorySessionsRepository;
let refreshTokensRepository: InMemoryRefreshTokensRepository;
let createSessionUseCase: CreateSessionUseCase;
let sut: VerifyMagicLinkUseCase;
let reply: { jwtSign: () => Promise<string> };

describe('Verify Magic Link Use Case', () => {
  beforeEach(() => {
    magicLinkTokensRepository = new InMemoryMagicLinkTokensRepository();
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
    sut = new VerifyMagicLinkUseCase(
      magicLinkTokensRepository,
      usersRepository,
      createSessionUseCase,
    );
  });

  async function createTokenForUser(userId: any, rawToken: string, options?: { expiresAt?: Date; usedAt?: Date }) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const token = await magicLinkTokensRepository.create({
      userId,
      token: hashedToken,
      email: 'test@example.com',
      expiresAt: options?.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000),
    });

    if (options?.usedAt) {
      await magicLinkTokensRepository.markAsUsed(token.id);
    }

    return token;
  }

  it('should authenticate with valid magic link token', async () => {
    await makeUser({
      email: 'magic@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];
    const rawToken = 'valid-raw-token-12345';

    await createTokenForUser(user.id, rawToken);

    const result = await sut.execute({
      token: rawToken,
      ip: '127.0.0.1',
      reply: reply as unknown as import('fastify').FastifyReply,
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('magic@example.com');
    expect(result.sessionId).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should reject expired token', async () => {
    await makeUser({
      email: 'expired@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];
    const rawToken = 'expired-token-12345';

    await createTokenForUser(user.id, rawToken, {
      expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
    });

    await expect(
      sut.execute({
        token: rawToken,
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toThrow('Link expirado. Solicite um novo.');
  });

  it('should reject already-used token', async () => {
    await makeUser({
      email: 'used@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];
    const rawToken = 'used-token-12345';

    await createTokenForUser(user.id, rawToken, {
      usedAt: new Date(),
    });

    await expect(
      sut.execute({
        token: rawToken,
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toThrow('Link já utilizado. Solicite um novo.');
  });

  it('should reject invalid/unknown token', async () => {
    await expect(
      sut.execute({
        token: 'completely-unknown-token',
        ip: '127.0.0.1',
        reply: reply as unknown as import('fastify').FastifyReply,
      }),
    ).rejects.toThrow('Link inválido.');
  });

  it('should create session with loginMethod magic_link', async () => {
    await makeUser({
      email: 'method@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const user = usersRepository['items'][0];
    const rawToken = 'method-check-token';

    await createTokenForUser(user.id, rawToken);

    await sut.execute({
      token: rawToken,
      ip: '127.0.0.1',
      reply: reply as unknown as import('fastify').FastifyReply,
    });

    const sessions = sessionsRepository['items'];
    expect(sessions).toHaveLength(1);
    expect(sessions[0].loginMethod).toBe('magic_link');
  });
});
