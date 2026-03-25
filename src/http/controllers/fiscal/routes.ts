import type { FastifyInstance } from 'fastify';
import { cancelDocumentController } from './v1-cancel-document.controller';
import { configureFiscalController } from './v1-configure-fiscal.controller';
import { correctionLetterController } from './v1-correction-letter.controller';
import { emitNFCeController } from './v1-emit-nfce.controller';
import { emitNFeController } from './v1-emit-nfe.controller';
import { fiscalWebhookController } from './v1-fiscal-webhook.controller';
import { getDocumentController } from './v1-get-document.controller';
import { getFiscalConfigController } from './v1-get-fiscal-config.controller';
import { listDocumentsController } from './v1-list-documents.controller';
import { uploadCertificateController } from './v1-upload-certificate.controller';

export async function fiscalRoutes(app: FastifyInstance) {
  // Configuration
  await app.register(configureFiscalController);
  await app.register(getFiscalConfigController);

  // Certificates
  await app.register(uploadCertificateController);

  // Document emission
  await app.register(emitNFeController);
  await app.register(emitNFCeController);

  // Document actions
  await app.register(cancelDocumentController);
  await app.register(correctionLetterController);

  // Document listing and details
  await app.register(listDocumentsController);
  await app.register(getDocumentController);

  // Public webhook
  await app.register(fiscalWebhookController);
}
