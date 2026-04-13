import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workstationTypeResponseSchema } from '@/http/schemas/production';
import { workstationTypeToDTO } from '@/mappers/production/workstation-type-to-dto';
import { makeListWorkstationTypesUseCase } from '@/use-cases/production/workstation-types/factories/make-list-workstation-types-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listWorkstationTypesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/workstation-types',
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
      summary: 'List all workstation types',
      response: {
        200: z.object({
          workstationTypes: z.array(workstationTypeResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const listWorkstationTypesUseCase = makeListWorkstationTypesUseCase();
      const { workstationTypes } = await listWorkstationTypesUseCase.execute({
        tenantId,
      });

      return reply.status(200).send({
        workstationTypes: workstationTypes.map(workstationTypeToDTO),
      });
    },
  });
}
