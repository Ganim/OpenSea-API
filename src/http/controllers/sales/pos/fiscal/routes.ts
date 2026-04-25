import type { FastifyInstance } from 'fastify';

import { v1EmitFiscalDocumentController } from './v1-emit-fiscal-document.controller';
import { v1GetFiscalConfigController } from './v1-get-fiscal-config.controller';
import { v1UpdateFiscalConfigController } from './v1-update-fiscal-config.controller';

/**
 * Registers the POS fiscal subsystem endpoints (Emporion Plan A — Task 32):
 *  - `GET /v1/admin/pos/fiscal-config` (JWT + tenant + `sales.pos.admin`)
 *  - `PUT /v1/admin/pos/fiscal-config` (JWT + tenant + `sales.pos.admin`)
 *  - `POST /v1/pos/fiscal/emit` (device-authenticated)
 *
 * The admin endpoints live under `/v1/admin/pos/...` while the emission
 * endpoint sits on the device-facing `/v1/pos/...` namespace because it is
 * called by the paired terminal, not by a human operator's browser.
 */
export async function posFiscalRoutes(app: FastifyInstance) {
  await app.register(v1GetFiscalConfigController);
  await app.register(v1UpdateFiscalConfigController);
  await app.register(v1EmitFiscalDocumentController);
}
