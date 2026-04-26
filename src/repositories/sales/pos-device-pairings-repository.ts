import type { PosDevicePairing } from '@/entities/sales/pos-device-pairing';

export interface PosDevicePairingsRepository {
  create(pairing: PosDevicePairing): Promise<void>;
  findByTerminalId(terminalId: string): Promise<PosDevicePairing | null>;
  findByDeviceTokenHash(hash: string): Promise<PosDevicePairing | null>;
  findByTokenHash(tokenHash: string): Promise<PosDevicePairing | null>;
  /**
   * Returns active (non-revoked) pairings for the given terminal IDs.
   * Used by listings to enrich each terminal with its current pairing state.
   */
  findManyActiveByTerminalIds(
    terminalIds: string[],
  ): Promise<PosDevicePairing[]>;
  save(pairing: PosDevicePairing): Promise<void>;
}
