import type { FastifyInstance } from 'fastify';

import { v1CreateSaleFromTerminalController } from './v1-create-sale-from-terminal.controller';

/**
 * Registers the device-authenticated POS Sales endpoints (Emporion Plan A —
 * Task 28+). Like the catalog group, these endpoints use
 * `verifyDeviceToken` per-controller, so they are mounted under the same
 * `posRoutes` parent without leaking the SALES module gate (which short-
 * circuits when `request.user` is absent).
 */
export async function posSalesRoutes(app: FastifyInstance) {
  await app.register(v1CreateSaleFromTerminalController);
}
