import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import type { TransactionClient } from '@/lib/transaction-manager';

import type { PosTerminalZonesRepository } from '../pos-terminal-zones-repository';

export class InMemoryPosTerminalZonesRepository
  implements PosTerminalZonesRepository
{
  public items: PosTerminalZone[] = [];

  async create(zone: PosTerminalZone, _tx?: TransactionClient): Promise<void> {
    this.items.push(zone);
  }

  async save(zone: PosTerminalZone, _tx?: TransactionClient): Promise<void> {
    const index = this.items.findIndex(
      (z) => z.id.toString() === zone.id.toString(),
    );
    if (index >= 0) this.items[index] = zone;
  }

  async remove(id: UniqueEntityID, _tx?: TransactionClient): Promise<void> {
    this.items = this.items.filter((z) => z.id.toString() !== id.toString());
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalZone | null> {
    return (
      this.items.find(
        (z) => z.id.toString() === id.toString() && z.tenantId === tenantId,
      ) ?? null
    );
  }

  async findByTerminalId(
    terminalId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalZone[]> {
    return this.items.filter(
      (z) =>
        z.terminalId.toString() === terminalId.toString() &&
        z.tenantId === tenantId,
    );
  }

  async findByTerminalAndZone(
    terminalId: UniqueEntityID,
    zoneId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalZone | null> {
    return (
      this.items.find(
        (z) =>
          z.terminalId.toString() === terminalId.toString() &&
          z.zoneId.toString() === zoneId.toString() &&
          z.tenantId === tenantId,
      ) ?? null
    );
  }
}
