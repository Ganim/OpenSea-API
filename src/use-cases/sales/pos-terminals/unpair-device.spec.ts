import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import { InMemoryPosDevicePairingsRepository } from '@/repositories/sales/in-memory/in-memory-pos-device-pairings-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnpairDeviceUseCase } from './unpair-device';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let posDevicePairingsRepository: InMemoryPosDevicePairingsRepository;
let sut: UnpairDeviceUseCase;

const tenantId = 'tenant-1';

describe('UnpairDeviceUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    posDevicePairingsRepository = new InMemoryPosDevicePairingsRepository();

    sut = new UnpairDeviceUseCase(
      posTerminalsRepository,
      posDevicePairingsRepository,
    );
  });

  it('should unpair a device successfully', async () => {
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
      deviceTokenHash: 'hash-abc',
      pairedByUserId: 'user-1',
    });
    posDevicePairingsRepository.items.push(pairing);

    await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      revokedByUserId: 'admin-1',
      reason: 'Device lost',
    });

    const updated = posDevicePairingsRepository.items[0];
    expect(updated.isActive).toBe(false);
    expect(updated.revokedAt).toBeInstanceOf(Date);
    expect(updated.revokedByUserId).toBe('admin-1');
    expect(updated.revokedReason).toBe('Device lost');
  });

  it('should throw ResourceNotFoundError for non-existing terminal', async () => {
    await expect(
      sut.execute({
        tenantId,
        terminalId: 'non-existing',
        revokedByUserId: 'admin-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError if no active pairing exists', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        revokedByUserId: 'admin-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError if pairing is already revoked', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const pairing = PosDevicePairing.create({
      id: 'pairing-revoked',
      tenantId: new UniqueEntityID(tenantId),
      terminalId: terminal.id,
      deviceLabel: 'Old Phone',
      deviceTokenHash: 'hash-revoked',
      pairedByUserId: 'user-1',
    });
    pairing.revoke('admin-1', 'Already revoked');
    posDevicePairingsRepository.items.push(pairing);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        revokedByUserId: 'admin-2',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
