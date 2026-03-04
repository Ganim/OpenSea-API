import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeHideItemUseCase } from '@/use-cases/storage/security/factories/make-hide-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function hideItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/security/hide',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.SECURITY.MANAGE,
        resource: 'storage-security',
      }),
    ],
    schema: {
      tags: ['Storage - Security'],
      summary: 'Hide a file or folder',
      body: z.object({
        itemId: z.string().uuid(),
        itemType: z.enum(['file', 'folder']),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { itemId, itemType } = request.body;

      try {
        const useCase = makeHideItemUseCase();
        await useCase.execute({ tenantId, itemId, itemType });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.ITEM_HIDE,
          entityId: itemId,
          placeholders: {
            itemType: itemType === 'file' ? 'arquivo' : 'pasta',
            itemName: itemId,
          },
        });

        return reply.status(200).send({
          message: `${itemType === 'file' ? 'Arquivo' : 'Pasta'} ocultado(a) com sucesso`,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
