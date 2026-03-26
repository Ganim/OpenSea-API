import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createQuoteController } from './v1-create-quote.controller';
import { updateQuoteController } from './v1-update-quote.controller';
import { deleteQuoteController } from './v1-delete-quote.controller';
import { getQuoteByIdController } from './v1-get-quote-by-id.controller';
import { listQuotesController } from './v1-list-quotes.controller';
import { sendQuoteController } from './v1-send-quote.controller';
import { convertQuoteToOrderController } from './v1-convert-quote-to-order.controller';
import { duplicateQuoteController } from './v1-duplicate-quote.controller';

export async function quotesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listQuotesController);
  await app.register(getQuoteByIdController);
  await app.register(createQuoteController);
  await app.register(updateQuoteController);
  await app.register(deleteQuoteController);
  await app.register(sendQuoteController);
  await app.register(convertQuoteToOrderController);
  await app.register(duplicateQuoteController);
}
