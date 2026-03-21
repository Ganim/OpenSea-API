import type { FastifyInstance } from 'fastify';
import { createEnvelopeController } from './v1-create-envelope.controller';
import { listEnvelopesController } from './v1-list-envelopes.controller';
import { getEnvelopeByIdController } from './v1-get-envelope-by-id.controller';
import { cancelEnvelopeController } from './v1-cancel-envelope.controller';
import { resendNotificationsController } from './v1-resend-notifications.controller';

export async function signatureEnvelopesRoutes(app: FastifyInstance) {
  await app.register(createEnvelopeController);
  await app.register(listEnvelopesController);
  await app.register(getEnvelopeByIdController);
  await app.register(cancelEnvelopeController);
  await app.register(resendNotificationsController);
}
