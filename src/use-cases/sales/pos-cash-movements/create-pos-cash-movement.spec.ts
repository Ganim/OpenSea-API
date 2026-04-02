import { InMemoryPosCashMovementsRepository } from '@/repositories/sales/in-memory/in-memory-pos-cash-movements-repository';
import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { PosSession } from '@/entities/sales/pos-session';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePosCashMovementUseCase } from './create-pos-cash-movement';

let posCashMovementsRepository: InMemoryPosCashMovementsRepository;
let posSessionsRepository: InMemoryPosSessionsRepository;
let sut: CreatePosCashMovementUseCase;

describe('CreatePosCashMovementUseCase', () => {
  beforeEach(() => {
    posCashMovementsRepository = new InMemoryPosCashMovementsRepository();
    posSessionsRepository = new InMemoryPosSessionsRepository();
    sut = new CreatePosCashMovementUseCase(
      posCashMovementsRepository,
      posSessionsRepository,
    );
  });

  it('should create a cash movement for an open session', async () => {
    const session = PosSession.create({
      tenantId: new UniqueEntityID('tenant-1'),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('user-1'),
      status: 'OPEN',
    });
    await posSessionsRepository.create(session);

    const { movement } = await sut.execute({
      tenantId: 'tenant-1',
      sessionId: session.id.toString(),
      type: 'SUPPLY',
      amount: 100,
      reason: 'Cash supply',
      performedByUserId: 'user-1',
    });

    expect(movement.type).toBe('SUPPLY');
    expect(movement.amount).toBe(100);
    expect(movement.reason).toBe('Cash supply');
    expect(posCashMovementsRepository.items).toHaveLength(1);
  });

  it('should throw if session is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        sessionId: 'non-existent',
        type: 'SUPPLY',
        amount: 100,
        performedByUserId: 'user-1',
      }),
    ).rejects.toThrow('Session not found.');
  });

  it('should throw if session is not open', async () => {
    const session = PosSession.create({
      tenantId: new UniqueEntityID('tenant-1'),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('user-1'),
      status: 'CLOSED',
    });
    await posSessionsRepository.create(session);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        sessionId: session.id.toString(),
        type: 'SUPPLY',
        amount: 100,
        performedByUserId: 'user-1',
      }),
    ).rejects.toThrow('Session is not open.');
  });

  it('should throw if amount is zero or negative', async () => {
    const session = PosSession.create({
      tenantId: new UniqueEntityID('tenant-1'),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('user-1'),
      status: 'OPEN',
    });
    await posSessionsRepository.create(session);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        sessionId: session.id.toString(),
        type: 'SUPPLY',
        amount: 0,
        performedByUserId: 'user-1',
      }),
    ).rejects.toThrow('Amount must be greater than zero.');
  });

  it('should set authorizedByUserId when provided', async () => {
    const session = PosSession.create({
      tenantId: new UniqueEntityID('tenant-1'),
      terminalId: new UniqueEntityID('terminal-1'),
      operatorUserId: new UniqueEntityID('user-1'),
      status: 'OPEN',
    });
    await posSessionsRepository.create(session);

    const { movement } = await sut.execute({
      tenantId: 'tenant-1',
      sessionId: session.id.toString(),
      type: 'WITHDRAWAL',
      amount: 50,
      performedByUserId: 'user-1',
      authorizedByUserId: 'manager-1',
    });

    expect(movement.authorizedByUserId?.toString()).toBe('manager-1');
  });
});
