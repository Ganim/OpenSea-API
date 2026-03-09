import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createCustomerController } from './v1-create-customer.controller';
import { deleteCustomerController } from './v1-delete-customer.controller';
import { getCustomerByIdController } from './v1-get-customer-by-id.controller';
import { listCustomersController } from './v1-list-customers.controller';
import { updateCustomerController } from './v1-update-customer.controller';

export async function customersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(getCustomerByIdController);
  await app.register(listCustomersController);
  await app.register(createCustomerController);
  await app.register(updateCustomerController);
  await app.register(deleteCustomerController);
}
