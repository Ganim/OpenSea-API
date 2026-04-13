import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import { PosSession } from '@/entities/sales/pos-session';
import { InMemoryPosDevicePairingsRepository } from '@/repositories/sales/in-memory/in-memory-pos-device-pairings-repository';
import { InMemoryPosSessionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-sessions-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetMyDeviceUseCase } from './get-my-device';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let posDevicePairingsRepository: InMemoryPosDevicePairingsRepository;
let posSessionsRepository: InMemoryPosSessionsRepository;
let sut: GetMyDeviceUseCase;

const tenantId = 'tenant-1';

describe('GetMyDeviceUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    posDevicePairingsRepository = new InMemoryPosDevicePairingsRepository();
    posSessionsRepository = new InMemoryPosSessionsRepository();

    sut = new GetMyDeviceUseCase(
      posTerminalsRepository,
      posDevicePairingsRepository,
      posSessionsRepository,
    );
  });

  it('should return terminal and current session for a valid device token', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const pairing = PosDevicePairing.create({
      id: 'pairing-1',
      tenantId: new UniqueEntityID(tenantId),
      terminalId: terminal.id,
      deviceLabel: 'My Phone',
      deviceTokenHash: 'hash-abc123',
      pairedByUserId: 'user-1',
    });
    posDevicePairingsRepository.items.push(pairing);

    const session = PosSession.create({
      tenantId: new UniqueEntityID(tenantId),
      terminalId: terminal.id,
      operatorUserId: new UniqueEntityID('user-1'),
      openingBalance: 100,
      status: 'OPEN',
    });
    posSessionsRepository.items.push(session);

    const result = await sut.execute({ deviceTokenHash: 'hash-abc123' });

    expect(result.terminal.id.toString()).toBe(terminal.id.toString());
    expect(result.currentSession).toBeTruthy();
    expect(result.currentSession?.status).toBe('OPEN');
  });

  it('should return null session if no active session exists', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const pairing = PosDevicePairing.create({
      id: 'pairing-2',
      tenantId: new UniqueEntityID(tenantId),
      terminalId: terminal.id,
      deviceLabel: 'My Phone',
      deviceTokenHash: 'hash-def456',
      pairedByUserId: 'user-1',
    });
    posDevicePairingsRepository.items.push(pairing);

    const result = await sut.execute({ deviceTokenHash: 'hash-def456' });

    expect(result.terminal).toBeTruthy();
    expect(result.currentSession).toBeNull();
  });

  it('should throw UnauthorizedError for invalid device token', async () => {
    await expect(
      sut.execute({ deviceTokenHash: 'invalid-hash' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should throw UnauthorizedError for revoked pairing', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const pairing = PosDevicePairing.create({
      id: 'pairing-3',
      tenantId: new UniqueEntityID(tenantId),
      terminalId: terminal.id,
      deviceLabel: 'My Phone',
      deviceTokenHash: 'hash-revoked',
      pairedByUserId: 'user-1',
    });
    pairing.revoke('admin-1', 'Security concern');
    posDevicePairingsRepository.items.push(pairing);

    await expect(
      sut.execute({ deviceTokenHash: 'hash-revoked' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should throw UnauthorizedError if terminal is inactive', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: false,
    });
    posTerminalsRepository.items.push(terminal);

    const pairing = PosDevicePairing.create({
      id: 'pairing-4',
      tenantId: new UniqueEntityID(tenantId),
      terminalId: terminal.id,
      deviceLabel: 'My Phone',
      deviceTokenHash: 'hash-inactive',
      pairedByUserId: 'user-1',
    });
    posDevicePairingsRepository.items.push(pairing);

    await expect(
      sut.execute({ deviceTokenHash: 'hash-inactive' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
