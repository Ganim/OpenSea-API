import type { FastifyInstance } from 'fastify';

import { v1GetCatalogDeltaController } from './v1-get-catalog-delta.controller';
import { v1GetCatalogFullController } from './v1-get-catalog-full.controller';

/**
 * Registers the POS Catalog endpoints.
 *
 * Catalog endpoints are device-authenticated (no JWT/RBAC) — the
 * `verifyDeviceToken` middleware is wired per-controller so this group can be
 * mounted under the same `posRoutes` parent without leaking the SALES module
 * gate (which short-circuits when `request.user` is absent).
 */
export async function posCatalogRoutes(app: FastifyInstance) {
  await app.register(v1GetCatalogDeltaController);
  await app.register(v1GetCatalogFullController);
}
