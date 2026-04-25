import type { PosDevicePairing } from '@/entities/sales/pos-device-pairing';

export interface PosDevicePairingsRepository {
  create(pairing: PosDevicePairing): Promise<void>;
  findByTerminalId(terminalId: string): Promise<PosDevicePairing | null>;
  findByDeviceTokenHash(hash: string): Promise<PosDevicePairing | null>;
  findByTokenHash(tokenHash: string): Promise<PosDevicePairing | null>;
  save(pairing: PosDevicePairing): Promise<void>;
}
