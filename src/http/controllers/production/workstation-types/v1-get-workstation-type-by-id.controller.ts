import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workstationTypeResponseSchema } from '@/http/schemas/production';
import { workstationTypeToDTO } from '@/mappers/production/workstation-type-to-dto';
import { makeGetWorkstationTypeByIdUseCase } from '@/use-cases/production/workstation-types/factories/make-get-workstation-type-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getWorkstationTypeByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/workstation-types/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ACCESS,
        resource: 'workstation-types',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Get a workstation type by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          workstationType: workstationTypeResponseSchema,
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

      const getWorkstationTypeByIdUseCase = makeGetWorkstationTypeByIdUseCase();
      const { workstationType } = await getWorkstationTypeByIdUseCase.execute({
        tenantId,
        id,
      });

      return reply
        .status(200)
        .send({ workstationType: workstationTypeToDTO(workstationType) });
    },
  });
}
