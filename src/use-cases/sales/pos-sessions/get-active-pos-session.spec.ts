import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { PosSession } from '@/entities/sales/pos-session';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetActivePosSessionUseCase } from './get-active-pos-session';

let posSessionsRepository: InMemoryPosSessionsRepository;
let sut: GetActivePosSessionUseCase;

describe('GetActivePosSessionUseCase', () => {
  beforeEach(() => {
    posSessionsRepository = new InMemoryPosSessionsRepository();
    sut = new GetActivePosSessionUseCase(posSessionsRepository);
  });

  it('should return the active session for a terminal', async () => {
    const session = PosSession.create({
      tenantId: new UniqueEntityID('tenant-1'),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('user-1'),
      status: 'OPEN',
    });
    await posSessionsRepository.create(session);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      terminalId: 'terminal-1',
    });

    expect(result.session).toBeTruthy();
    expect(result.session?.id.toString()).toBe(session.id.toString());
  });

  it('should return null when no active session exists', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      terminalId: 'terminal-1',
    });

    expect(result.session).toBeNull();
  });

  it('should not return closed sessions', async () => {
    const session = PosSession.create({
      tenantId: new UniqueEntityID('tenant-1'),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('user-1'),
      status: 'CLOSED',
    });
    await posSessionsRepository.create(session);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      terminalId: 'terminal-1',
    });

    expect(result.session).toBeNull();
  });
});
