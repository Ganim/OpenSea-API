import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
import { InMemoryPosDevicePairingsRepository } from '@/repositories/sales/in-memory/in-memory-pos-device-pairings-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';
import { beforeEach, describe, expect, it } from 'vitest';
import { PairDevicePublicUseCase } from './pair-device-public';

let posTerminalsRepository: InMemoryPosTerminalsRepository;
let posDevicePairingsRepository: InMemoryPosDevicePairingsRepository;
let sut: PairDevicePublicUseCase;

const tenantId = 'tenant-1';

describe('PairDevicePublicUseCase', () => {
  beforeEach(() => {
    posTerminalsRepository = new InMemoryPosTerminalsRepository();
    posDevicePairingsRepository = new InMemoryPosDevicePairingsRepository();

    sut = new PairDevicePublicUseCase(
      posTerminalsRepository,
      posDevicePairingsRepository,
    );
  });

  it('should pair a device with valid code (public flow)', async () => {
    const secret = 'a'.repeat(64);
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      pairingSecret: secret,
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const { code } = getCurrentPairingCode(secret);

    const result = await sut.execute({
      pairingCode: code,
      deviceLabel: 'Emporion fresh install',
    });

    expect(result.deviceToken).toBeTruthy();
    expect(result.deviceToken.length).toBe(64);
    expect(posDevicePairingsRepository.items).toHaveLength(1);
    expect(posDevicePairingsRepository.items[0].pairingSource).toBe('PUBLIC');
    expect(posDevicePairingsRepository.items[0].pairedByUserId).toBe('public');
  });

  it('should throw BadRequestError for invalid pairing code', async () => {
    await expect(
      sut.execute({
        pairingCode: 'INVALIDCODE',
        deviceLabel: 'My Device',
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
      pairedByUserId: 'public',
      pairingSource: 'PUBLIC',
    });
    posDevicePairingsRepository.items.push(existingPairing);

    const { code } = getCurrentPairingCode(secret);

    await expect(
      sut.execute({
        pairingCode: code,
        deviceLabel: 'New Device',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reactivate a previously revoked pairing instead of creating a new one (public flow)', async () => {
    const secret = 'c'.repeat(64);
    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      pairingSecret: secret,
      isActive: true,
    });
    posTerminalsRepository.items.push(terminal);

    const oldPairing = PosDevicePairing.create({
      id: 'old-pairing-id',
      tenantId: new UniqueEntityID(tenantId),
      terminalId: terminal.id,
      deviceLabel: 'Old Emporion',
      deviceTokenHash: 'old-hash',
      pairedByUserId: 'public',
      pairingSource: 'PUBLIC',
    });
    oldPairing.revoke('admin-user-1', 'reset for new install');
    posDevicePairingsRepository.items.push(oldPairing);

    const { code } = getCurrentPairingCode(secret);

    const result = await sut.execute({
      pairingCode: code,
      deviceLabel: 'New Emporion',
    });

    // Single row preserved (terminalId @unique)
    expect(posDevicePairingsRepository.items).toHaveLength(1);

    const reactivated = posDevicePairingsRepository.items[0];
    expect(reactivated.pairingId).toBe('old-pairing-id');
    expect(reactivated.deviceLabel).toBe('New Emporion');
    expect(reactivated.pairedByUserId).toBe('public');
    expect(reactivated.pairingSource).toBe('PUBLIC');
    expect(reactivated.isActive).toBe(true);
    expect(reactivated.revokedAt).toBeUndefined();
    expect(reactivated.revokedReason).toBeUndefined();
    expect(reactivated.deviceTokenHash).not.toBe('old-hash');

    expect(result.deviceToken).toBeTruthy();
    expect(result.deviceToken.length).toBe(64);
  });
});
