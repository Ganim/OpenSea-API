import type { FastifyInstance } from 'fastify';
import { uploadCertificateController } from './v1-upload-certificate.controller';
import { listCertificatesController } from './v1-list-certificates.controller';
import { deleteCertificateController } from './v1-delete-certificate.controller';

export async function signatureCertificatesRoutes(app: FastifyInstance) {
  await app.register(uploadCertificateController);
  await app.register(listCertificatesController);
  await app.register(deleteCertificateController);
}
