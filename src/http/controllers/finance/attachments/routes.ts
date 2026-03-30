import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { uploadAttachmentController } from './v1-upload-attachment.controller';
import { deleteAttachmentController } from './v1-delete-attachment.controller';
import { listAttachmentsController } from './v1-list-attachments.controller';

export async function financeAttachmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listAttachmentsController);
    },
    { prefix: '' },
  );

  // Mutation routes (upload is heavy)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(uploadAttachmentController);
      mutationApp.register(deleteAttachmentController);
    },
    { prefix: '' },
  );
}
