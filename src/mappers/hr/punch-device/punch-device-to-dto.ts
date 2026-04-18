import type { PunchDevice } from '@/entities/hr/punch-device';

/**
 * DTO público do PunchDevice — explicitamente REMOVE campos sensíveis.
 *
 * Research Pitfall 5 / Threat T-04-01 (Information disclosure):
 * - `pairingSecret` só é exibido uma vez (na resposta de `register`). Após
 *   isso, NUNCA deve aparecer em list/get endpoints.
 * - `deviceTokenHash` é o hash SHA-256 do deviceToken; por ser hash
 *   derivado de um token opaco, vazá-lo permite ataque offline contra o
 *   espaço de 256 bits. Proibido em qualquer response.
 * - `revokedReason` pode conter informação sensível (ex.: "roubado por
 *   funcionário X") — fica restrito a endpoints de admin detalhado,
 *   não no DTO público.
 *
 * A sentinela de acceptance do Plan (Task 4 e2e) é:
 *   expect(JSON.stringify(response.body)).not.toContain('pairingSecret')
 *   expect(JSON.stringify(response.body)).not.toContain('deviceTokenHash')
 */
export interface PunchDeviceDTO {
  id: string;
  tenantId: string;
  name: string;
  deviceKind:
    | 'PWA_PERSONAL'
    | 'KIOSK_PUBLIC'
    | 'BIOMETRIC_READER'
    | 'WEBAUTHN_PC';
  deviceLabel: string | null;
  geofenceZoneId: string | null;
  isPaired: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  pairedAt: string | null;
  revokedAt: string | null;
  lastSeenAt: string | null;
  ipAddress: string | null;
  hostname: string | null;
  version: string | null;
  createdAt: string;
  // PROIBIDO: pairingSecret, deviceTokenHash, revokedReason, revokedByUserId
}

export function punchDeviceToDTO(device: PunchDevice): PunchDeviceDTO {
  return {
    id: device.id.toString(),
    tenantId: device.tenantId.toString(),
    name: device.name,
    deviceKind: device.deviceKind,
    deviceLabel: device.deviceLabel ?? null,
    geofenceZoneId: device.geofenceZoneId?.toString() ?? null,
    isPaired: device.isPaired,
    status: device.status,
    pairedAt: device.pairedAt?.toISOString() ?? null,
    revokedAt: device.revokedAt?.toISOString() ?? null,
    lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
    ipAddress: device.ipAddress ?? null,
    hostname: device.hostname ?? null,
    version: device.version ?? null,
    createdAt: device.createdAt.toISOString(),
  };
}
