import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalZone } from '@/entities/sales/pos-terminal-zone';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface PosTerminalZonesRepository {
  create(zone: PosTerminalZone, tx?: TransactionClient): Promise<void>;
  save(zone: PosTerminalZone, tx?: TransactionClient): Promise<void>;
  remove(id: UniqueEntityID, tx?: TransactionClient): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalZone | null>;
  findByTerminalId(
    terminalId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalZone[]>;
  findByTerminalAndZone(
    terminalId: UniqueEntityID,
    zoneId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalZone | null>;
}
