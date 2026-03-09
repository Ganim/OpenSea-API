import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { addReactionController } from './v1-add-reaction.controller';
import { createCommentController } from './v1-create-comment.controller';
import { deleteCommentController } from './v1-delete-comment.controller';
import { listCommentsController } from './v1-list-comments.controller';
import { removeReactionController } from './v1-remove-reaction.controller';
import { updateCommentController } from './v1-update-comment.controller';

export async function taskCommentsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(createCommentController);
  app.register(updateCommentController);
  app.register(deleteCommentController);
  app.register(listCommentsController);
  app.register(addReactionController);
  app.register(removeReactionController);
}
