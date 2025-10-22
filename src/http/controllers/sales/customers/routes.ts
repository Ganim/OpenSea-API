import { verifyJwt } from '@/http/middlewares/verify-jwt';
import type { FastifyInstance } from 'fastify';
import { v1CreateCustomerController } from './v1-create-customer.controller';
import { v1DeleteCustomerController } from './v1-delete-customer.controller';
import { v1GetCustomerByIdController } from './v1-get-customer-by-id.controller';
import { v1ListCustomersController } from './v1-list-customers.controller';
import { v1UpdateCustomerController } from './v1-update-customer.controller';

export async function customersRoutes(app: FastifyInstance) {
  app.post(
    '/v1/customers',
    {
      onRequest: [verifyJwt],
      schema: v1CreateCustomerController.schema,
    },
    v1CreateCustomerController,
  );

  app.get(
    '/v1/customers/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetCustomerByIdController.schema,
    },
    v1GetCustomerByIdController,
  );

  app.get(
    '/v1/customers',
    {
      onRequest: [verifyJwt],
      schema: v1ListCustomersController.schema,
    },
    v1ListCustomersController,
  );

  app.put(
    '/v1/customers/:id',
    {
      onRequest: [verifyJwt],
      schema: v1UpdateCustomerController.schema,
    },
    v1UpdateCustomerController,
  );

  app.delete(
    '/v1/customers/:id',
    {
      onRequest: [verifyJwt],
      schema: v1DeleteCustomerController.schema,
    },
    v1DeleteCustomerController,
  );
}
