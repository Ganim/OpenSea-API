import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PosDevicePairing,
  type PosDevicePairingProps,
} from '@/entities/sales/pos-device-pairing';

export function makePosDevicePairing(
  override: Partial<PosDevicePairingProps> & { isActive?: boolean } = {},
  id?: UniqueEntityID,
): PosDevicePairing {
  const { isActive, ...rest } = override;

  const pairing = PosDevicePairing.create(
    {
      id: rest.id ?? new UniqueEntityID().toString(),
      tenantId: rest.tenantId ?? new UniqueEntityID(),
      terminalId: rest.terminalId ?? new UniqueEntityID(),
      deviceLabel: rest.deviceLabel ?? 'Device Test',
      deviceTokenHash: rest.deviceTokenHash ?? 'hash-test',
      pairedByUserId: rest.pairedByUserId ?? 'user-test',
      pairedAt: rest.pairedAt ?? new Date(),
      lastSeenAt: rest.lastSeenAt,
      revokedAt: rest.revokedAt,
      revokedByUserId: rest.revokedByUserId,
      revokedReason: rest.revokedReason,
    },
    id,
  );

  if (isActive === false && !pairing.revokedAt) {
    pairing.revoke(rest.revokedByUserId ?? 'system', rest.revokedReason);
  }

  return pairing;
}
