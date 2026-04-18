import type { FastifyRequest } from 'fastify';
import { verifyJwt } from './verify-jwt';
import { verifyPunchDeviceToken } from './verify-punch-device-token';
import { verifyTenant } from './verify-tenant';

const PUNCH_DEVICE_TOKEN_HEADER = 'x-punch-device-token';

/**
 * Composite auth for the unified punch endpoint (POST /v1/hr/punch/clock).
 *
 * Accepts either of the two trust paths documented in D-08:
 * - **device-token path** — kiosk/PWA/biometric reader paired via
 *   `PairPunchDeviceUseCase`. Header `x-punch-device-token` is present.
 *   Permission checks are bypassed because the device was pre-authorized
 *   at pairing time.
 * - **JWT path** — regular user hitting the endpoint with their Bearer
 *   token (e.g. "punch from my phone"). Runs `verifyJwt` + `verifyTenant`
 *   so that the downstream handler can consult `request.user.tenantId`
 *   and the use case can enforce employeeId = JWT's own employee.
 *
 * The header takes precedence over the JWT: if `x-punch-device-token` is
 * present, only that path runs. This prevents ambiguity if a kiosk ever
 * happens to also forward a user's JWT (it should not, but we defend
 * against the misconfiguration rather than adding a rejection rule).
 */
export async function verifyPunchDeviceTokenOrJwt(request: FastifyRequest) {
  const hasDeviceHeader = !!request.headers[PUNCH_DEVICE_TOKEN_HEADER];

  if (hasDeviceHeader) {
    await verifyPunchDeviceToken(request);
    return;
  }

  await verifyJwt(request);
  await verifyTenant(request);
}
