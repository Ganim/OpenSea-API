import { rateLimitConfig } from '@/config/rate-limits';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { v1CreateCustomerController } from './v1-create-customer.controller';
import { v1DeleteCustomerController } from './v1-delete-customer.controller';
import { v1GetCustomerByIdController } from './v1-get-customer-by-id.controller';
import { v1ListCustomersController } from './v1-list-customers.controller';
import { v1UpdateCustomerController } from './v1-update-customer.controller';

export async function customersRoutes(app: FastifyInstance) {
  // Rotas de consulta com rate limit de query
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);

      queryApp.get(
        '/v1/customers/:id',
        {
          onRequest: [verifyJwt],
          schema: v1GetCustomerByIdController.schema,
        },
        v1GetCustomerByIdController,
      );

      queryApp.get(
        '/v1/customers',
        {
          onRequest: [verifyJwt],
          schema: v1ListCustomersController.schema,
        },
        v1ListCustomersController,
      );
    },
    { prefix: '' },
  );

  // Rotas de mutação com rate limit específico
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);

      mutationApp.post(
        '/v1/customers',
        {
          onRequest: [verifyJwt],
          schema: v1CreateCustomerController.schema,
        },
        v1CreateCustomerController,
      );

      mutationApp.put(
        '/v1/customers/:id',
        {
          onRequest: [verifyJwt],
          schema: v1UpdateCustomerController.schema,
        },
        v1UpdateCustomerController,
      );

      mutationApp.delete(
        '/v1/customers/:id',
        {
          onRequest: [verifyJwt],
          schema: v1DeleteCustomerController.schema,
        },
        v1DeleteCustomerController,
      );
    },
    { prefix: '' },
  );
}
