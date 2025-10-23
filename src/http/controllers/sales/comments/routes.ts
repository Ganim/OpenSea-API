import { verifyJwt } from '@/http/middlewares/verify-jwt';
import type { FastifyInstance } from 'fastify';
import { v1CreateCommentController } from './v1-create-comment.controller';
import { v1DeleteCommentController } from './v1-delete-comment.controller';
import { v1GetCommentByIdController } from './v1-get-comment-by-id.controller';
import { v1ListCommentsController } from './v1-list-comments.controller';
import { v1UpdateCommentController } from './v1-update-comment.controller';

export async function commentsRoutes(app: FastifyInstance) {
  app.post(
    '/v1/comments',
    {
      onRequest: [verifyJwt],
      schema: v1CreateCommentController.schema,
    },
    v1CreateCommentController,
  );

  app.get(
    '/v1/comments/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetCommentByIdController.schema,
    },
    v1GetCommentByIdController,
  );

  app.get(
    '/v1/comments',
    {
      onRequest: [verifyJwt],
      schema: v1ListCommentsController.schema,
    },
    v1ListCommentsController,
  );

  app.put(
    '/v1/comments/:id',
    {
      onRequest: [verifyJwt],
      schema: v1UpdateCommentController.schema,
    },
    v1UpdateCommentController,
  );

  app.delete(
    '/v1/comments/:id',
    {
      onRequest: [verifyJwt],
      schema: v1DeleteCommentController.schema,
    },
    v1DeleteCommentController,
  );
}
