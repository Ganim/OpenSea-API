import type { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import type { PosSession } from '@/entities/sales/pos-session';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import type { VerifiedDeviceContext } from '@/http/middlewares/verify-device-token';

declare module 'fastify' {
  interface FastifyRequest {
    terminal?: PosTerminal;
    devicePairing?: PosDevicePairing;
    currentSession?: PosSession | null;
    /**
     * Set by `verifyDeviceToken` preHandler when a request authenticates via
     * device-token instead of JWT. Always present after that middleware
     * passes; absent on JWT-authenticated routes.
     */
    device?: VerifiedDeviceContext;
  }
}
