import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { getProposalSignatureStatusController } from './v1-get-proposal-signature-status.controller';
import { getQuoteSignatureStatusController } from './v1-get-quote-signature-status.controller';
import { requestProposalSignatureController } from './v1-request-proposal-signature.controller';
import { requestQuoteSignatureController } from './v1-request-quote-signature.controller';

export async function salesSignaturesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(requestQuoteSignatureController);
  await app.register(getQuoteSignatureStatusController);
  await app.register(requestProposalSignatureController);
  await app.register(getProposalSignatureStatusController);
}
