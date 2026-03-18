import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { locationHealthSummaryResponseSchema } from '@/http/schemas/stock/locations/location.schema';
import { makeGetLocationHealthSummaryUseCase } from '@/use-cases/stock/admin/factories/make-get-location-health-summary-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getLocationHealthSummaryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/locations/health-summary',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.READ,
        resource: 'bins',
      }),
    ],
    schema: {
      tags: ['Stock - Locations'],
      summary: 'Get location health summary',
      description:
        'Returns aggregated health metrics for all locations in a tenant, including occupancy, blocked bins, orphaned items, expiring items, and occupancy inconsistencies.',
      response: {
        200: locationHealthSummaryResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const getLocationHealthSummaryUseCase =
        makeGetLocationHealthSummaryUseCase();

      const healthSummary = await getLocationHealthSummaryUseCase.execute({
        tenantId,
      });

      return reply.status(200).send(healthSummary);
    },
  });
}
