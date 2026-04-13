import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import { InMemoryPosDevicePairingsRepository } from '@/repositories/sales/in-memory/in-memory-pos-device-pairings-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';
import { beforeEach, describe, expect, it } from 'vitest';
import { PairThisDeviceUseCase } from './pair-this-device';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let posDevicePairingsRepository: InMemoryPosDevicePairingsRepository;
let sut: PairThisDeviceUseCase;

const tenantId = 'tenant-1';

describe('PairThisDeviceUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    posDevicePairingsRepository = new InMemoryPosDevicePairingsRepository();

    sut = new PairThisDeviceUseCase(
      posTerminalsRepository,
      posDevicePairingsRepository,
    );
  });

  it('should pair a device directly by terminal ID', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const result = await sut.execute({
      tenantId,
      terminalId: terminal.id.toString(),
      deviceLabel: 'This Browser',
      pairedByUserId: 'user-1',
    });

    expect(result.deviceToken).toBeTruthy();
    expect(result.deviceToken.length).toBe(64);
    expect(result.terminal.id.toString()).toBe(terminal.id.toString());
    expect(posDevicePairingsRepository.items).toHaveLength(1);
    expect(posDevicePairingsRepository.items[0].deviceLabel).toBe(
      'This Browser',
    );
  });

  it('should throw ResourceNotFoundError for non-existing terminal', async () => {
    await expect(
      sut.execute({
        tenantId,
        terminalId: 'non-existing',
        deviceLabel: 'My Device',
        pairedByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if terminal is inactive', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: false,
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        deviceLabel: 'My Device',
        pairedByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError if terminal already has active pairing', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const existingPairing = PosDevicePairing.create({
      id: 'existing-pairing',
      tenantId: new UniqueEntityID(tenantId),
      terminalId: terminal.id,
      deviceLabel: 'Old Device',
      deviceTokenHash: 'old-hash',
      pairedByUserId: 'user-1',
    });
    posDevicePairingsRepository.items.push(existingPairing);

    await expect(
      sut.execute({
        tenantId,
        terminalId: terminal.id.toString(),
        deviceLabel: 'New Device',
        pairedByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
