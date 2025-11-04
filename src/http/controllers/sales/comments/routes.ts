import type { FastifyInstance } from 'fastify';
import { createCommentController } from './v1-create-comment.controller';
import { deleteCommentController } from './v1-delete-comment.controller';
import { getCommentByIdController } from './v1-get-comment-by-id.controller';
import { listCommentsController } from './v1-list-comments.controller';
import { updateCommentController } from './v1-update-comment.controller';

export async function commentsRoutes(app: FastifyInstance) {
  await app.register(getCommentByIdController);
  await app.register(listCommentsController);
  await app.register(createCommentController);
  await app.register(updateCommentController);
  await app.register(deleteCommentController);
}
