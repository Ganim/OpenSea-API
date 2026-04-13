import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bomResponseSchema } from '@/http/schemas/production';
import { bomToDTO } from '@/mappers/production/bom-to-dto';
import { makeGetBomByIdUseCase } from '@/use-cases/production/boms/factories/make-get-bom-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBomByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/boms/:id',
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
      summary: 'Get a bill of materials by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          bom: bomResponseSchema,
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

      const getBomByIdUseCase = makeGetBomByIdUseCase();
      const { bom } = await getBomByIdUseCase.execute({ tenantId, id });

      return reply.status(200).send({ bom: bomToDTO(bom) });
    },
  });
}
