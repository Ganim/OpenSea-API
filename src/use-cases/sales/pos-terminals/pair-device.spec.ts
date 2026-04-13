import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
import { InMemoryPosDevicePairingsRepository } from '@/repositories/sales/in-memory/in-memory-pos-device-pairings-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';
import { beforeEach, describe, expect, it } from 'vitest';
import { PairDeviceUseCase } from './pair-device';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let posDevicePairingsRepository: InMemoryPosDevicePairingsRepository;
let sut: PairDeviceUseCase;

const tenantId = 'tenant-1';

describe('PairDeviceUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    posDevicePairingsRepository = new InMemoryPosDevicePairingsRepository();

    sut = new PairDeviceUseCase(
      posTerminalsRepository,
      posDevicePairingsRepository,
    );
  });

  it('should pair a device with a valid pairing code', async () => {
    const secret = 'a'.repeat(64);
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      pairingSecret: secret,
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const { code } = getCurrentPairingCode(secret);

    const result = await sut.execute({
      tenantId,
      pairingCode: code,
      deviceLabel: 'My Tablet',
      pairedByUserId: 'user-1',
    });

    expect(result.deviceToken).toBeTruthy();
    expect(result.deviceToken.length).toBe(64); // 32 bytes hex
    expect(result.terminal.id.toString()).toBe(terminal.id.toString());
    expect(posDevicePairingsRepository.items).toHaveLength(1);
  });

  it('should throw BadRequestError for invalid pairing code', async () => {
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    await expect(
      sut.execute({
        tenantId,
        pairingCode: 'INVALIDCODE',
        deviceLabel: 'My Tablet',
        pairedByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError if terminal already has active pairing', async () => {
    const secret = 'b'.repeat(64);
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      pairingSecret: secret,
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

    const { code } = getCurrentPairingCode(secret);

    await expect(
      sut.execute({
        tenantId,
        pairingCode: code,
        deviceLabel: 'New Device',
        pairedByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
