import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workstationResponseSchema } from '@/http/schemas/production';
import { workstationToDTO } from '@/mappers/production/workstation-to-dto';
import { makeGetWorkstationByIdUseCase } from '@/use-cases/production/workstations/factories/make-get-workstation-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getWorkstationByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/workstations/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ACCESS,
        resource: 'workstations',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Get a workstation by ID',
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: z.object({
          workstation: workstationResponseSchema,
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

      const getWorkstationByIdUseCase = makeGetWorkstationByIdUseCase();
      const { workstation } = await getWorkstationByIdUseCase.execute({
        tenantId,
        id,
      });

      return reply
        .status(200)
        .send({ workstation: workstationToDTO(workstation) });
    },
  });
}
