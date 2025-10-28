import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import type { FastifyInstance } from 'fastify';
import { createTagController } from './v1-create-tag.controller';
import { deleteTagController } from './v1-delete-tag.controller';
import { getTagByIdController } from './v1-get-tag-by-id.controller';
import { listTagsController } from './v1-list-tags.controller';
import { updateTagController } from './v1-update-tag.controller';

export async function tagsRoutes(app: FastifyInstance) {
  await app.register(createTagController, {
    onRequest: [verifyJwt, verifyUserManager],
  });

  await app.register(listTagsController, {
    onRequest: [verifyJwt],
  });

  await app.register(getTagByIdController, {
    onRequest: [verifyJwt],
  });

  await app.register(updateTagController, {
    onRequest: [verifyJwt, verifyUserManager],
  });

  await app.register(deleteTagController, {
    onRequest: [verifyJwt, verifyUserManager],
  });
}
