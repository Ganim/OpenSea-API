import { createHash } from 'node:crypto';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { prisma } from '@/lib/prisma';
import type { FastifyRequest } from 'fastify';

const PUNCH_DEVICE_TOKEN_HEADER = 'x-punch-device-token';

/**
 * Authenticates a request via the opaque device token issued by
 * `PairPunchDeviceUseCase` (Plan 04-02).
 *
 * CRITICAL — PUNCH-CORE-08 (< 5s revocation):
 *   Every request performs a fresh `findUnique` against
 *   `prisma.punchDevice` keyed by the SHA-256 hash of the token. We do NOT
 *   cache the device row in memory or in Redis. If perf ever becomes a
 *   concern, a Redis TTL cache of 5s or less is acceptable; anything
 *   longer violates the "instant revocation" contract.
 *
 * Failure modes (all mapped to `UnauthorizedError`):
 * - Header absent → "Missing punch device token"
 * - Hash not found in DB → "Invalid or revoked punch device token"
 * - `revokedAt IS NOT NULL` → "Invalid or revoked punch device token"
 * - `deletedAt IS NOT NULL` → "Invalid or revoked punch device token"
 *
 * Side effects:
 *   Fire-and-forget `lastSeenAt` heartbeat update. The update is
 *   intentionally non-blocking — if the DB write fails (e.g. transient
 *   connection error) auth MUST still succeed, otherwise a minor infra
 *   glitch would mass-revoke every paired device.
 *
 * Fields populated on `request`:
 * - `request.punchDevice` — populated for downstream handlers
 * - `request.tenantId` — populated so generic multi-tenant code paths
 *   (which read `request.tenantId`) continue to work even when no JWT was
 *   verified.
 */
export async function verifyPunchDeviceToken(request: FastifyRequest) {
  const headerValue = request.headers[PUNCH_DEVICE_TOKEN_HEADER];
  const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!token) {
    throw new UnauthorizedError('Missing punch device token');
  }

  const deviceTokenHash = createHash('sha256').update(token).digest('hex');

  const device = await prisma.punchDevice.findUnique({
    where: { deviceTokenHash },
  });

  if (!device || device.revokedAt || device.deletedAt) {
    throw new UnauthorizedError('Invalid or revoked punch device token');
  }

  // Opportunistic heartbeat — never allowed to block authentication.
  prisma.punchDevice
    .update({
      where: { id: device.id },
      data: { lastSeenAt: new Date(), status: 'ONLINE' },
    })
    .catch(() => {
      /* intentionally swallowed; heartbeat must never block auth */
    });

  request.punchDevice = {
    id: device.id,
    tenantId: device.tenantId,
    deviceKind: device.deviceKind,
    geofenceZoneId: device.geofenceZoneId,
  };
  (request as unknown as { tenantId: string }).tenantId = device.tenantId;
}
