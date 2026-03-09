import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createTagController } from './v1-create-tag.controller';
import { deleteTagController } from './v1-delete-tag.controller';
import { getTagByIdController } from './v1-get-tag-by-id.controller';
import { listTagsController } from './v1-list-tags.controller';
import { updateTagController } from './v1-update-tag.controller';

export async function tagsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  await app.register(createTagController);
  await app.register(listTagsController);
  await app.register(getTagByIdController);
  await app.register(updateTagController);
  await app.register(deleteTagController);
}
