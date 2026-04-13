import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bomItemResponseSchema } from '@/http/schemas/production';
import { bomItemToDTO } from '@/mappers/production/bom-item-to-dto';
import { makeListBomItemsUseCase } from '@/use-cases/production/bom-items/factories/make-list-bom-items-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBomItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/boms/:bomId/items',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ACCESS,
        resource: 'bom-items',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'List all items of a bill of materials',
      params: z.object({
        bomId: z.string(),
      }),
      response: {
        200: z.object({
          bomItems: z.array(bomItemResponseSchema),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const _tenantId = request.user.tenantId!;
      const { bomId } = request.params;

      const listBomItemsUseCase = makeListBomItemsUseCase();
      const { bomItems } = await listBomItemsUseCase.execute({
        bomId,
      });

      return reply.status(200).send({ bomItems: bomItems.map(bomItemToDTO) });
    },
  });
}
