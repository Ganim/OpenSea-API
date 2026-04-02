import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { PosSession } from '@/entities/sales/pos-session';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPosSessionsUseCase } from './list-pos-sessions';

let posSessionsRepository: InMemoryPosSessionsRepository;
let sut: ListPosSessionsUseCase;

describe('ListPosSessionsUseCase', () => {
  beforeEach(() => {
    posSessionsRepository = new InMemoryPosSessionsRepository();
    sut = new ListPosSessionsUseCase(posSessionsRepository);
  });

  it('should list sessions with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await posSessionsRepository.create(
        PosSession.create({
          tenantId: new UniqueEntityID('tenant-1'),
          terminalId: new UniqueEntityID('terminal-1'),
          operatorUserId: new UniqueEntityID('user-1'),
        }),
      );
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 3,
    });

    expect(result.sessions).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no sessions exist', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
    });

    expect(result.sessions).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should filter by status', async () => {
    await posSessionsRepository.create(
      PosSession.create({
        tenantId: new UniqueEntityID('tenant-1'),
        terminalId: new UniqueEntityID('terminal-1'),
        operatorUserId: new UniqueEntityID('user-1'),
        status: 'OPEN',
      }),
    );
    await posSessionsRepository.create(
      PosSession.create({
        tenantId: new UniqueEntityID('tenant-1'),
        terminalId: new UniqueEntityID('terminal-2'),
        operatorUserId: new UniqueEntityID('user-1'),
        status: 'CLOSED',
      }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 20,
      status: 'OPEN',
    });

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].status).toBe('OPEN');
  });
});
