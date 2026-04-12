import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { v1DeletePrinterController } from './v1-delete-printer.controller';
import { v1ListPrintersController } from './v1-list-printers.controller';
import { v1RegisterPrinterController } from './v1-register-printer.controller';
import { v1SetDefaultPrinterController } from './v1-set-default-printer.controller';
import { v1TogglePrinterHiddenController } from './v1-toggle-printer-hidden.controller';

export async function printersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1ListPrintersController);
  await app.register(v1RegisterPrinterController);
  await app.register(v1DeletePrinterController);
  await app.register(v1TogglePrinterHiddenController);
  await app.register(v1SetDefaultPrinterController);
}
