import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workstationResponseSchema } from '@/http/schemas/production';
import { workstationToDTO } from '@/mappers/production/workstation-to-dto';
import { makeListWorkstationsUseCase } from '@/use-cases/production/workstations/factories/make-list-workstations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listWorkstationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/workstations',
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
      summary: 'List all workstations',
      response: {
        200: z.object({
          workstations: z.array(workstationResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const listWorkstationsUseCase = makeListWorkstationsUseCase();
      const { workstations } =
        await listWorkstationsUseCase.execute({ tenantId });

      return reply
        .status(200)
        .send({ workstations: workstations.map(workstationToDTO) });
    },
  });
}
