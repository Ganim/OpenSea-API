import type { PosDevicePairing } from '@/entities/sales/pos-device-pairing';

export interface PosDevicePairingDTO {
  id: string;
  tenantId: string;
  terminalId: string;
  deviceLabel: string;
  pairedAt: string;
  lastSeenAt: string | null;
  pairedByUserId: string;
  revokedAt: string | null;
  revokedByUserId: string | null;
  revokedReason: string | null;
  isActive: boolean;
}

export function posDevicePairingToDTO(
  pairing: PosDevicePairing,
): PosDevicePairingDTO {
  return {
    id: pairing.pairingId,
    tenantId: pairing.tenantId.toString(),
    terminalId: pairing.terminalId.toString(),
    deviceLabel: pairing.deviceLabel,
    pairedAt: pairing.pairedAt.toISOString(),
    lastSeenAt: pairing.lastSeenAt?.toISOString() ?? null,
    pairedByUserId: pairing.pairedByUserId,
    revokedAt: pairing.revokedAt?.toISOString() ?? null,
    revokedByUserId: pairing.revokedByUserId ?? null,
    revokedReason: pairing.revokedReason ?? null,
    isActive: pairing.isActive,
  };
}
