import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  setupLocationBodySchema,
  setupLocationResponseSchema,
} from '@/http/schemas/stock/locations/location.schema';
import { makeSetupLocationUseCase } from '@/use-cases/stock/locations/factories/make-setup-location-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function setupLocationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/locations/setup',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.WAREHOUSES.REGISTER,
        resource: 'warehouses',
      }),
    ],
    schema: {
      tags: ['Stock - Locations'],
      summary: 'Atomic setup of warehouse + zones + bins',
      description:
        'Creates a warehouse with its zones and bins in a single atomic transaction. If any step fails, the entire operation is rolled back.',
      body: setupLocationBodySchema,
      response: {
        201: setupLocationResponseSchema,
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { warehouse, zones } = request.body;

      const setupLocationUseCase = makeSetupLocationUseCase();

      const setupResult = await setupLocationUseCase.execute({
        tenantId,
        warehouse,
        zones,
      });

      return reply.status(201).send(setupResult);
    },
  });
}
