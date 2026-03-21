import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createContactController } from './v1-create-contact.controller';
import { deleteContactController } from './v1-delete-contact.controller';
import { getContactByIdController } from './v1-get-contact-by-id.controller';
import { listContactsController } from './v1-list-contacts.controller';
import { updateContactController } from './v1-update-contact.controller';

export async function contactsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteContactController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createContactController);
      mutationApp.register(updateContactController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getContactByIdController);
      queryApp.register(listContactsController);
    },
    { prefix: '' },
  );
}
