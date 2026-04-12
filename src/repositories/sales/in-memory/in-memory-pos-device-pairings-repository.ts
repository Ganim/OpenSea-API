import type { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import type { PosDevicePairingsRepository } from '../pos-device-pairings-repository';

export class InMemoryPosDevicePairingsRepository
  implements PosDevicePairingsRepository
{
  public items: PosDevicePairing[] = [];

  async create(pairing: PosDevicePairing): Promise<void> {
    this.items.push(pairing);
  }

  async findByTerminalId(terminalId: string): Promise<PosDevicePairing | null> {
    return (
      this.items.find((p) => p.terminalId.toString() === terminalId) ?? null
    );
  }

  async findByDeviceTokenHash(hash: string): Promise<PosDevicePairing | null> {
    return this.items.find((p) => p.deviceTokenHash === hash) ?? null;
  }

  async save(pairing: PosDevicePairing): Promise<void> {
    const index = this.items.findIndex(
      (p) => p.pairingId === pairing.pairingId,
    );
    if (index >= 0) this.items[index] = pairing;
  }
}
