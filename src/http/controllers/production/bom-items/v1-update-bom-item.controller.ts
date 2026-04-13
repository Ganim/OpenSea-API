import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateBomItemSchema,
  bomItemResponseSchema,
} from '@/http/schemas/production';
import { bomItemToDTO } from '@/mappers/production/bom-item-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateBomItemUseCase } from '@/use-cases/production/bom-items/factories/make-update-bom-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateBomItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/boms/:bomId/items/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.MODIFY,
        resource: 'bom-items',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Update a BOM item',
      params: z.object({
        bomId: z.string().uuid(),
        id: z.string().uuid(),
      }),
      body: updateBomItemSchema,
      response: {
        200: z.object({
          bomItem: bomItemResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const _tenantId = request.user.tenantId!;
      const { bomId, id } = request.params;
      const {
        materialId,
        sequence,
        quantity,
        unit,
        wastagePercent,
        isOptional,
        substituteForId,
        notes,
      } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateBomItemUseCase = makeUpdateBomItemUseCase();
      const { bomItem } = await updateBomItemUseCase.execute({
        id,
        materialId,
        sequence,
        quantity,
        unit,
        wastagePercent,
        isOptional,
        substituteForId,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.BOM_ITEM_UPDATE,
        entityId: bomItem.id.toString(),
        placeholders: { userName },
        newData: {
          bomId,
          materialId,
          sequence,
          quantity,
          unit,
          wastagePercent,
          isOptional,
          substituteForId,
          notes,
        },
      });

      return reply.status(200).send({ bomItem: bomItemToDTO(bomItem) });
    },
  });
}
