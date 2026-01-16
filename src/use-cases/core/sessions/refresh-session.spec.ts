import { Token } from '@/entities/core/value-objects/token';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryRefreshTokensRepository } from '@/repositories/core/in-memory/in-memory-refresh-tokens-repository';
import { InMemorySessionsRepository } from '@/repositories/core/in-memory/in-memory-sessions-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import type { PermissionService } from '@/services/rbac/permission-service';
import { makeSession } from '@/utils/tests/factories/core/make-session';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { faker } from '@faker-js/faker/locale/en';
import type { FastifyReply } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshSessionUseCase } from './refresh-session';

let sessionsRepository: InMemorySessionsRepository;
let usersRepository: InMemoryUsersRepository;
let refreshTokensRepository: InMemoryRefreshTokensRepository;
let permissionService: PermissionService;
let sut: RefreshSessionUseCase;
let reply: FastifyReply;

describe('RefreshSessionUseCase', () => {
  beforeEach(() => {
    sessionsRepository = new InMemorySessionsRepository();
    usersRepository = new InMemoryUsersRepository();
    refreshTokensRepository = new InMemoryRefreshTokensRepository();
    permissionService = {
      getUserPermissionCodes: vi.fn().mockResolvedValue(['permission:read']),
    } as unknown as PermissionService;
    sut = new RefreshSessionUseCase(
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      permissionService,
    );
    const jwtSignMock = vi.fn().mockResolvedValue(faker.internet.jwt());
    reply = { jwtSign: jwtSignMock } as unknown as FastifyReply;
  });

  // OBJECTIVE

  it('should refresh a session and return new session and refresh token', async () => {
    const { user } = await makeUser({
      email: 'user@example.com',
      password: 'password123',
      usersRepository,
    });

    const { session, refreshToken } = await makeSession({
      userId: user.id,
      ip: '1.2.3.4',
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      reply,
    });

    const result = await sut.execute({
      refreshToken,
      ip: '5.6.7.8',
      reply,
    });

    expect(result.session.id).toBe(session.id);
    expect(result.session.ip).toBe('5.6.7.8');
    expect(result.permissions).toEqual(['permission:read']);
  });

  it('should throw if refresh token is revoked', async () => {
    const { user } = await makeUser({
      email: 'user6@example.com',
      password: 'password123',
      usersRepository,
    });

    const { session, refreshToken } = await makeSession({
      userId: user.id,
      ip: '10.10.10.10',
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      reply,
    });

    const sessionId = new UniqueEntityID(session.id);
    await refreshTokensRepository.revokeBySessionId(sessionId);

    await expect(
      sut.execute({
        refreshToken,
        ip: '10.10.10.10',
        reply,
      }),
    ).rejects.toThrow('Refresh token has been revoked.');
  });

  // REJECTS

  it('should throw if refresh token is not found', async () => {
    await expect(
      sut.execute({
        refreshToken: 'non-existent-token',
        ip: '1.1.1.1',
        reply,
      }),
    ).rejects.toThrow('Invalid refresh token.');
  });

  it('should throw if refresh token is expired', async () => {
    const { user } = await makeUser({
      email: 'user3@example.com',
      password: 'password123',
      usersRepository,
    });

    const { session } = await makeSession({
      userId: user.id,
      ip: '1.1.1.1',
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      reply,
    });

    const expiredToken = faker.internet.jwt();

    // Create an expired refresh token
    await refreshTokensRepository.create({
      userId: new UniqueEntityID(user.id),
      sessionId: new UniqueEntityID(session.id),
      token: Token.create(expiredToken),
      expiresAt: new Date(Date.now() - 1000), // Expired
    });

    await expect(
      sut.execute({
        refreshToken: expiredToken,
        ip: '1.1.1.1',
        reply,
      }),
    ).rejects.toThrow('Refresh token has expired.');
  });

  it('should throw if session is not found', async () => {
    const { user } = await makeUser({
      email: 'user2@example.com',
      password: 'password123',
      usersRepository,
    });

    const token = faker.internet.jwt();
    const fakeSessionId = new UniqueEntityID();

    // Create refresh token without session
    await refreshTokensRepository.create({
      userId: new UniqueEntityID(user.id),
      sessionId: fakeSessionId,
      token: Token.create(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await expect(
      sut.execute({
        refreshToken: token,
        ip: '1.1.1.1',
        reply,
      }),
    ).rejects.toThrow('Session not found.');
  });

  it('should throw if user is not found', async () => {
    const fakeUserId = new UniqueEntityID();

    const session = await sessionsRepository.create({
      userId: fakeUserId,
      ip: { value: '1.1.1.1' } as any,
    });

    const token = faker.internet.jwt();

    await refreshTokensRepository.create({
      userId: fakeUserId,
      sessionId: session.id,
      token: Token.create(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await expect(
      sut.execute({
        refreshToken: token,
        ip: '1.1.1.1',
        reply,
      }),
    ).rejects.toThrow('User not found.');
  });

  // VALIDATIONS

  it('should throw if IP address is invalid', async () => {
    const { user } = await makeUser({
      email: 'userip@example.com',
      password: 'password123',
      usersRepository,
    });

    const { refreshToken } = await makeSession({
      userId: user.id,
      ip: '9.9.9.9',
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      reply,
    });

    await expect(
      sut.execute({
        refreshToken,
        ip: 'invalid-ip',
        reply,
      }),
    ).rejects.toThrow();
  });

  // EDGE CASES

  it('should allow refreshing session with same IP', async () => {
    const { user } = await makeUser({
      email: 'user4@example.com',
      password: 'password123',
      usersRepository,
    });

    const { session, refreshToken } = await makeSession({
      userId: user.id,
      ip: '9.9.9.9',
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      reply,
    });

    const result = await sut.execute({
      refreshToken,
      ip: '9.9.9.9',
      reply,
    });

    expect(result.session.ip).toBe('9.9.9.9');
  });

  it('should create a new refresh token with 7 days expiration', async () => {
    const { user } = await makeUser({
      email: 'user5@example.com',
      password: 'password123',
      usersRepository,
    });

    const { refreshToken } = await makeSession({
      userId: user.id,
      ip: '8.8.8.8',
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      reply,
    });

    const result = await sut.execute({
      refreshToken,
      ip: '8.8.8.8',
      reply,
    });

    const expiresAt = result.refreshToken.expiresAt;
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(
      Date.now() + 6 * 24 * 60 * 60 * 1000,
    );
  });

  it('should revoke old refresh token after refresh', async () => {
    const { user } = await makeUser({
      email: 'user7@example.com',
      password: 'password123',
      usersRepository,
    });

    const { refreshToken: oldRefreshToken } = await makeSession({
      userId: user.id,
      ip: '7.7.7.7',
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      reply,
    });

    await sut.execute({
      refreshToken: oldRefreshToken,
      ip: '7.7.7.7',
      reply,
    });

    // Old token should be revoked
    const storedOldToken = await refreshTokensRepository.findByToken(
      Token.create(oldRefreshToken),
    );
    expect(storedOldToken?.revokedAt).not.toBeNull();
  });

  it('should throw if session is expired', async () => {
    const { user } = await makeUser({
      email: 'user8@example.com',
      password: 'password123',
      usersRepository,
    });

    const { session, refreshToken } = await makeSession({
      userId: user.id,
      ip: '6.6.6.6',
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      reply,
    });

    // Expire the session
    await sessionsRepository.expire(new UniqueEntityID(session.id));

    await expect(
      sut.execute({
        refreshToken,
        ip: '6.6.6.6',
        reply,
      }),
    ).rejects.toThrow('Session has expired.');
  });

  it('should throw if session is revoked', async () => {
    const { user } = await makeUser({
      email: 'user9@example.com',
      password: 'password123',
      usersRepository,
    });

    const { session, refreshToken } = await makeSession({
      userId: user.id,
      ip: '5.5.5.5',
      sessionsRepository,
      usersRepository,
      refreshTokensRepository,
      reply,
    });

    // Revoke the session
    await sessionsRepository.revoke(new UniqueEntityID(session.id));

    await expect(
      sut.execute({
        refreshToken,
        ip: '5.5.5.5',
        reply,
      }),
    ).rejects.toThrow('Session has been revoked.');
  });
});
