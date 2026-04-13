import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workCenterResponseSchema } from '@/http/schemas/production';
import { workCenterToDTO } from '@/mappers/production/work-center-to-dto';
import { makeListWorkCentersUseCase } from '@/use-cases/production/work-centers/factories/make-list-work-centers-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listWorkCentersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/work-centers',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ACCESS,
        resource: 'work-centers',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'List all work centers',
      response: {
        200: z.object({
          workCenters: z.array(workCenterResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const listWorkCentersUseCase = makeListWorkCentersUseCase();
      const { workCenters } = await listWorkCentersUseCase.execute({
        tenantId,
      });

      return reply
        .status(200)
        .send({ workCenters: workCenters.map(workCenterToDTO) });
    },
  });
}
