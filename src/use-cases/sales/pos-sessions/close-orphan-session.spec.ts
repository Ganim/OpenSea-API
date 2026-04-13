import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosSession } from '@/entities/sales/pos-session';
import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CloseOrphanSessionUseCase } from './close-orphan-session';

let posSessionsRepository: InMemoryPosSessionsRepository;
let sut: CloseOrphanSessionUseCase;

const tenantId = 'tenant-1';

describe('CloseOrphanSessionUseCase', () => {
  beforeEach(() => {
    posSessionsRepository = new InMemoryPosSessionsRepository();
    sut = new CloseOrphanSessionUseCase(posSessionsRepository);
  });

  it('should close an open session as orphan', async () => {
    const session = PosSession.create({
      tenantId: new UniqueEntityID(tenantId),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('user-1'),
      openingBalance: 100,
    });
    posSessionsRepository.items.push(session);

    const result = await sut.execute({
      tenantId,
      sessionId: session.id.toString(),
      closedByUserId: 'admin-1',
    });

    expect(result.session.status).toBe('CLOSED');
    expect(result.session.orphanClosed).toBe(true);
    expect(result.session.closedAt).toBeInstanceOf(Date);
    expect(result.session.notes).toContain('Force-closed as orphan');
  });

  it('should throw ResourceNotFoundError for non-existing session', async () => {
    await expect(
      sut.execute({
        tenantId,
        sessionId: 'non-existing',
        closedByUserId: 'admin-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if session is not open', async () => {
    const session = PosSession.create({
      tenantId: new UniqueEntityID(tenantId),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('user-1'),
      openingBalance: 100,
      status: 'CLOSED',
    });
    posSessionsRepository.items.push(session);

    await expect(
      sut.execute({
        tenantId,
        sessionId: session.id.toString(),
        closedByUserId: 'admin-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
