import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { locationResponseSchema } from '@/http/schemas';
import { makeListLocationsByLocationIdUseCase } from '@/use-cases/stock/locations/factories/make-list-locations-by-location-id-use-case';

export async function listLocationsByLocationIdController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/locations/:locationId/sub-locations',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.LOCATIONS.LIST,
        resource: 'locations',
      }),
    ],
    schema: {
      tags: ['Stock - Locations'],
      summary: 'List sub-locations by location ID',
      description:
        'List all active sub-locations for a specific location with counts',
      security: [{ bearerAuth: [] }],
      params: z.object({
        locationId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          locations: z.array(locationResponseSchema),
        }),
      },
    },

    handler: async (request, reply) => {
      const { locationId } = request.params;

      const listLocationsByLocationIdUseCase =
        makeListLocationsByLocationIdUseCase();

      const { locations } = await listLocationsByLocationIdUseCase.execute({
        locationId,
      });

      return reply.status(200).send({ locations });
    },
  });
}
