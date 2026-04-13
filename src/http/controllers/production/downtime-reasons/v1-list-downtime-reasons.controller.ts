import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { downtimeReasonResponseSchema } from '@/http/schemas/production';
import { downtimeReasonToDTO } from '@/mappers/production/downtime-reason-to-dto';
import { makeListDowntimeReasonsUseCase } from '@/use-cases/production/downtime-reasons/factories/make-list-downtime-reasons-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listDowntimeReasonsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/downtime-reasons',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.ACCESS,
        resource: 'downtime-reasons',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'List all downtime reasons',
      response: {
        200: z.object({
          downtimeReasons: z.array(downtimeReasonResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const listDowntimeReasonsUseCase = makeListDowntimeReasonsUseCase();
      const { downtimeReasons } = await listDowntimeReasonsUseCase.execute({
        tenantId,
      });

      return reply.status(200).send({
        downtimeReasons: downtimeReasons.map(downtimeReasonToDTO),
      });
    },
  });
}
