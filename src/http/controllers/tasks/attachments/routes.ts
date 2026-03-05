import type { FastifyInstance } from 'fastify';

import { deleteAttachmentController } from './v1-delete-attachment.controller';
import { listAttachmentsController } from './v1-list-attachments.controller';
import { uploadAttachmentController } from './v1-upload-attachment.controller';

export async function taskAttachmentsRoutes(app: FastifyInstance) {
  app.register(uploadAttachmentController);
  app.register(deleteAttachmentController);
  app.register(listAttachmentsController);
}
