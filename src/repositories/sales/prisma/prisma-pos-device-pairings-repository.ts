import type { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import { prisma } from '@/lib/prisma';
import { posDevicePairingPrismaToDomain } from '@/mappers/sales/pos-device-pairing/pos-device-pairing-prisma-to-domain';
import type { PosDevicePairingsRepository } from '../pos-device-pairings-repository';

import type { PosPairingSource as PrismaPairingSource } from '@prisma/generated/client.js';

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
        appVersion: pairing.appVersion ?? null,
        pairedByUserId: pairing.pairedByUserId,
        pairingSource: pairing.pairingSource as PrismaPairingSource,
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

  async findManyActiveByTerminalIds(
    terminalIds: string[],
  ): Promise<PosDevicePairing[]> {
    if (terminalIds.length === 0) return [];
    const rows = await prisma.posDevicePairing.findMany({
      where: {
        terminalId: { in: terminalIds },
        revokedAt: null,
      },
    });
    return rows.map(posDevicePairingPrismaToDomain);
  }

  async save(pairing: PosDevicePairing): Promise<void> {
    await prisma.posDevicePairing.update({
      where: { id: pairing.pairingId },
      data: {
        deviceLabel: pairing.deviceLabel,
        lastSeenAt: pairing.lastSeenAt ?? null,
        appVersion: pairing.appVersion ?? null,
        revokedAt: pairing.revokedAt ?? null,
        revokedByUserId: pairing.revokedByUserId ?? null,
        revokedReason: pairing.revokedReason ?? null,
      },
    });
  }
}
