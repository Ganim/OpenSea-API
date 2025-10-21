import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import type { FastifyInstance } from 'fastify';
import { v1CreateTagController } from './v1-create-tag.controller';
import { v1DeleteTagController } from './v1-delete-tag.controller';
import { v1GetTagByIdController } from './v1-get-tag-by-id.controller';
import { v1ListTagsController } from './v1-list-tags.controller';
import { v1UpdateTagController } from './v1-update-tag.controller';

export async function tagsRoutes(app: FastifyInstance) {
  app.post(
    '/v1/tags',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1CreateTagController.schema,
    },
    v1CreateTagController,
  );

  app.get(
    '/v1/tags',
    {
      onRequest: [verifyJwt],
      schema: v1ListTagsController.schema,
    },
    v1ListTagsController,
  );

  app.get(
    '/v1/tags/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetTagByIdController.schema,
    },
    v1GetTagByIdController,
  );

  app.put(
    '/v1/tags/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1UpdateTagController.schema,
    },
    v1UpdateTagController,
  );

  app.delete(
    '/v1/tags/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1DeleteTagController.schema,
    },
    v1DeleteTagController,
  );
}
