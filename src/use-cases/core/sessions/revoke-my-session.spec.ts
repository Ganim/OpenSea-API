import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { IpAddress } from '@/entities/core/value-objects/ip-address';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySessionsRepository } from '@/repositories/core/in-memory/in-memory-sessions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RevokeMySessionUseCase } from './revoke-my-session';

describe('RevokeMySessionUseCase', () => {
  let sut: RevokeMySessionUseCase;
  let sessionsRepository: InMemorySessionsRepository;
  let userId: UniqueEntityID;

  beforeEach(() => {
    sessionsRepository = new InMemorySessionsRepository();
    sut = new RevokeMySessionUseCase(sessionsRepository);
    userId = new UniqueEntityID('user-1');
  });

  it('should revoke my own session', async () => {
    const session = await sessionsRepository.create({
      userId,
      ip: IpAddress.create('192.168.1.1'),
    });

    await sut.execute({
      sessionId: session.id.toString(),
      userId: userId.toString(),
    });

    const revokedSession = await sessionsRepository.findById(session.id);

    expect(revokedSession?.revokedAt).toBeInstanceOf(Date);
  });

  it('should not revoke session that does not exist', async () => {
    await expect(
      sut.execute({
        sessionId: 'non-existent-session',
        userId: userId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not revoke session that is already expired', async () => {
    const session = await sessionsRepository.create({
      userId,
      ip: IpAddress.create('192.168.1.1'),
    });

    await sessionsRepository.expire(session.id);

    await expect(
      sut.execute({
        sessionId: session.id.toString(),
        userId: userId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not revoke session that is already revoked', async () => {
    const session = await sessionsRepository.create({
      userId,
      ip: IpAddress.create('192.168.1.1'),
    });

    await sessionsRepository.revoke(session.id);

    await expect(
      sut.execute({
        sessionId: session.id.toString(),
        userId: userId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not revoke session that belongs to another user', async () => {
    const otherUserId = new UniqueEntityID('user-2');

    const session = await sessionsRepository.create({
      userId: otherUserId,
      ip: IpAddress.create('192.168.1.1'),
    });

    await expect(
      sut.execute({
        sessionId: session.id.toString(),
        userId: userId.toString(),
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
