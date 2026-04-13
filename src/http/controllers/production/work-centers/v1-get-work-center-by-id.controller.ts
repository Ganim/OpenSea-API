import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workCenterResponseSchema } from '@/http/schemas/production';
import { workCenterToDTO } from '@/mappers/production/work-center-to-dto';
import { makeGetWorkCenterByIdUseCase } from '@/use-cases/production/work-centers/factories/make-get-work-center-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getWorkCenterByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/work-centers/:id',
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
      summary: 'Get a work center by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          workCenter: workCenterResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const getWorkCenterByIdUseCase = makeGetWorkCenterByIdUseCase();
      const { workCenter } = await getWorkCenterByIdUseCase.execute({
        tenantId,
        id,
      });

      return reply
        .status(200)
        .send({ workCenter: workCenterToDTO(workCenter) });
    },
  });
}
