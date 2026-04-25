import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { posTerminalZonePrismaToDomain } from '@/mappers/sales/pos-terminal-zone/pos-terminal-zone-prisma-to-domain';

import type { PosTerminalZonesRepository } from '../pos-terminal-zones-repository';

import type { PosZoneTier as PrismaPosZoneTier } from '@prisma/generated/client.js';

export class PrismaPosTerminalZonesRepository
  implements PosTerminalZonesRepository
{
  async create(zone: PosTerminalZone, tx?: TransactionClient): Promise<void> {
    const client = tx ?? prisma;
    await client.posTerminalZone.create({
      data: {
        id: zone.id.toString(),
        terminalId: zone.terminalId.toString(),
        zoneId: zone.zoneId.toString(),
        tier: zone.tier.value as PrismaPosZoneTier,
        tenantId: zone.tenantId,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt ?? new Date(),
      },
    });
  }

  async save(zone: PosTerminalZone, tx?: TransactionClient): Promise<void> {
    const client = tx ?? prisma;
    await client.posTerminalZone.update({
      where: { id: zone.id.toString() },
      data: {
        terminalId: zone.terminalId.toString(),
        zoneId: zone.zoneId.toString(),
        tier: zone.tier.value as PrismaPosZoneTier,
        tenantId: zone.tenantId,
        updatedAt: zone.updatedAt ?? new Date(),
      },
    });
  }

  async remove(id: UniqueEntityID, tx?: TransactionClient): Promise<void> {
    const client = tx ?? prisma;
    await client.posTerminalZone.delete({
      where: { id: id.toString() },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalZone | null> {
    const raw = await prisma.posTerminalZone.findFirst({
      where: { id: id.toString(), tenantId },
    });
    return raw ? posTerminalZonePrismaToDomain(raw) : null;
  }

  async findByTerminalId(
    terminalId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalZone[]> {
    const rows = await prisma.posTerminalZone.findMany({
      where: { terminalId: terminalId.toString(), tenantId },
    });
    return rows.map(posTerminalZonePrismaToDomain);
  }

  async findByTerminalAndZone(
    terminalId: UniqueEntityID,
    zoneId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalZone | null> {
    const raw = await prisma.posTerminalZone.findFirst({
      where: {
        terminalId: terminalId.toString(),
        zoneId: zoneId.toString(),
        tenantId,
      },
    });
    return raw ? posTerminalZonePrismaToDomain(raw) : null;
  }
}
