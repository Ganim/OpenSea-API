import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1DeletePunchDeviceController } from './v1-delete-punch-device.controller';
import { v1GetPunchDevicePairingCodeController } from './v1-get-punch-device-pairing-code.controller';
import { v1ListPunchDevicesController } from './v1-list-punch-devices.controller';
import { v1PairPunchDeviceController } from './v1-pair-punch-device.controller';
import { v1RegisterPunchDeviceController } from './v1-register-punch-device.controller';
import { v1UnpairPunchDeviceController } from './v1-unpair-punch-device.controller';

/**
 * Aggregator das rotas de PunchDevice (HR module scoped).
 * Espelha o pattern de `punch-config/routes.ts` e `time-control/routes.ts`:
 * - addHook preHandler → createModuleMiddleware('HR') para enforcement do módulo
 * - 2 sub-apps: mutation (rate-limit mais estrito) e query (rate-limit mais permissivo)
 */
export async function punchDevicesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1RegisterPunchDeviceController);
      mutationApp.register(v1PairPunchDeviceController);
      mutationApp.register(v1UnpairPunchDeviceController);
      mutationApp.register(v1DeletePunchDeviceController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListPunchDevicesController);
      queryApp.register(v1GetPunchDevicePairingCodeController);
    },
    { prefix: '' },
  );
}
