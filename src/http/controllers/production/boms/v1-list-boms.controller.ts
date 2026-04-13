import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bomResponseSchema } from '@/http/schemas/production';
import { bomToDTO } from '@/mappers/production/bom-to-dto';
import { makeListBomsUseCase } from '@/use-cases/production/boms/factories/make-list-boms-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBomsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/boms',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ACCESS,
        resource: 'boms',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'List all bills of materials',
      response: {
        200: z.object({
          boms: z.array(bomResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const listBomsUseCase = makeListBomsUseCase();
      const { boms } = await listBomsUseCase.execute({ tenantId });

      return reply.status(200).send({ boms: boms.map(bomToDTO) });
    },
  });
}
