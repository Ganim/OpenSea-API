import type { FastifyInstance } from 'fastify';

import { uploadAttachmentController } from './v1-upload-attachment.controller';
import { deleteAttachmentController } from './v1-delete-attachment.controller';
import { listAttachmentsController } from './v1-list-attachments.controller';

export async function financeAttachmentsRoutes(app: FastifyInstance) {
  app.register(uploadAttachmentController);
  app.register(deleteAttachmentController);
  app.register(listAttachmentsController);
}
