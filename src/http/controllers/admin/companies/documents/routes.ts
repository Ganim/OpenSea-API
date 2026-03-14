import type { FastifyInstance } from 'fastify';
import { createCompanyDocumentController } from './v1-create-company-document.controller';
import { deleteCompanyDocumentController } from './v1-delete-company-document.controller';
import { getCompanyDocumentFileController } from './v1-get-company-document-file.controller';
import { listCompanyDocumentsController } from './v1-list-company-documents.controller';

export async function adminCompanyDocumentsRoutes(app: FastifyInstance) {
  await app.register(createCompanyDocumentController);
  await app.register(deleteCompanyDocumentController);
  await app.register(listCompanyDocumentsController);
  await app.register(getCompanyDocumentFileController);
}
