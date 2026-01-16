import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { occupancyMapResponseSchema } from '@/http/schemas/stock/bins/bin.schema';
import { makeGetBinOccupancyMapUseCase } from '@/use-cases/stock/bins/factories/make-get-bin-occupancy-map-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBinOccupancyMapController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bins/occupancy',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.LIST,
        resource: 'bins',
      }),
    ],
    schema: {
      tags: ['Stock - Bins'],
      summary: 'Get bin occupancy map for a zone (for 2D visualization)',
      querystring: z.object({
        zoneId: z.string().uuid(),
      }),
      response: {
        200: occupancyMapResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { zoneId } = request.query;

      try {
        const getBinOccupancyMapUseCase = makeGetBinOccupancyMapUseCase();
        const { occupancyData, stats } =
          await getBinOccupancyMapUseCase.execute({
            zoneId,
          });

        return reply.status(200).send({ occupancyData, stats });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
