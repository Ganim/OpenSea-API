import type { FastifyInstance } from 'fastify';
import { getItemByIdController } from './v1-get-item-by-id.controller';
import { listItemsController } from './v1-list-items.controller';
import { registerItemEntryController } from './v1-register-item-entry.controller';
import { registerItemExitController } from './v1-register-item-exit.controller';
import { transferItemController } from './v1-transfer-item.controller';

export async function itemsRoutes(app: FastifyInstance) {
  app.register(getItemByIdController);
  app.register(listItemsController);
  app.register(registerItemEntryController);
  app.register(registerItemExitController);
  app.register(transferItemController);
}
