import type { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import { prisma } from '@/lib/prisma';
import { posDevicePairingPrismaToDomain } from '@/mappers/sales/pos-device-pairing/pos-device-pairing-prisma-to-domain';
import type { PosDevicePairingsRepository } from '../pos-device-pairings-repository';

export class PrismaPosDevicePairingsRepository
  implements PosDevicePairingsRepository
{
  async create(pairing: PosDevicePairing): Promise<void> {
    await prisma.posDevicePairing.create({
      data: {
        id: pairing.pairingId,
        tenantId: pairing.tenantId.toString(),
        terminalId: pairing.terminalId.toString(),
        deviceLabel: pairing.deviceLabel,
        deviceTokenHash: pairing.deviceTokenHash,
        pairedAt: pairing.pairedAt,
        lastSeenAt: pairing.lastSeenAt ?? null,
        pairedByUserId: pairing.pairedByUserId,
        revokedAt: pairing.revokedAt ?? null,
        revokedByUserId: pairing.revokedByUserId ?? null,
        revokedReason: pairing.revokedReason ?? null,
      },
    });
  }

  async findByTerminalId(terminalId: string): Promise<PosDevicePairing | null> {
    const raw = await prisma.posDevicePairing.findUnique({
      where: { terminalId },
    });
    return raw ? posDevicePairingPrismaToDomain(raw) : null;
  }

  async findByDeviceTokenHash(hash: string): Promise<PosDevicePairing | null> {
    const raw = await prisma.posDevicePairing.findUnique({
      where: { deviceTokenHash: hash },
    });
    return raw ? posDevicePairingPrismaToDomain(raw) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<PosDevicePairing | null> {
    const raw = await prisma.posDevicePairing.findFirst({
      where: { deviceTokenHash: tokenHash },
    });
    return raw ? posDevicePairingPrismaToDomain(raw) : null;
  }

  async save(pairing: PosDevicePairing): Promise<void> {
    await prisma.posDevicePairing.update({
      where: { id: pairing.pairingId },
      data: {
        deviceLabel: pairing.deviceLabel,
        lastSeenAt: pairing.lastSeenAt ?? null,
        revokedAt: pairing.revokedAt ?? null,
        revokedByUserId: pairing.revokedByUserId ?? null,
        revokedReason: pairing.revokedReason ?? null,
      },
    });
  }
}
