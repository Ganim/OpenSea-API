/**
 * Punch-Bio routes aggregator — Plan 10-04.
 *
 * Pattern mirrors punch-devices/routes.ts:
 *   - addHook preHandler → createModuleMiddleware('HR')
 *   - mutation sub-app with stricter rate-limit
 */
import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1EnrollPinController } from './v1-enroll-pin.controller';
import { v1NotifyUpdateFailedController } from './v1-notify-update-failed.controller';
import { v1WebAuthnRegisterOptionsController } from '../webauthn/v1-register-options.controller';
import { v1WebAuthnRegisterController } from '../webauthn/v1-register.controller';
import { v1WebAuthnAuthenticateOptionsController } from '../webauthn/v1-authenticate-options.controller';
import { v1WebAuthnAuthenticateController } from '../webauthn/v1-authenticate.controller';

export async function punchBioRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes (enrollment is a write operation)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1EnrollPinController);
      // Plan 10-06: agent notifies API when auto-update fails (device-token auth)
      mutationApp.register(v1NotifyUpdateFailedController);
      // Plan 10-07 (D-G1): WebAuthn fallback — 4 endpoints
      mutationApp.register(v1WebAuthnRegisterOptionsController);
      mutationApp.register(v1WebAuthnRegisterController);
      mutationApp.register(v1WebAuthnAuthenticateOptionsController);
      mutationApp.register(v1WebAuthnAuthenticateController);
    },
    { prefix: '' },
  );
}
